import 'dart:io';

import 'package:flutter/foundation.dart' show debugPrint, kDebugMode;
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';

/// Logging em arquivos CSV (separador `;`), um arquivo por dia, separados por
/// finalidade em subdiretórios de `logs/`:
///
/// - `errors/`: hora;origem;erro;stacktrace
/// - `http/`:   hora;request;payload;code;status;response
/// - `geral/`:  hora;origem;mensagem
///
/// Substitui a versão anterior baseada em `dart:developer`, que só escrevia no
/// VM service — ou seja, não deixava rastro nenhum em release. Num coletor em
/// chão de fábrica isso significava zero diagnóstico quando algo falhava.
///
/// Campos são escapados conforme a RFC 4180, então `;`, aspas e quebras de
/// linha dentro dos valores são seguros para Excel/Sheets. Trechos marcados
/// com `>!conteudo!<` viram `******`.
///
/// O arquivo do dia fica em texto (appends baratos e à prova de queda); os
/// dias anteriores são comprimidos para `.csv.gz` no boot.
///
/// **Armazenamento:** `getExternalStorageDirectory()` devolve
/// `Android/data/com.zztech.ztm/files/`, que é privado do app. Não exige
/// permissão alguma desde a API 19, não é afetado pelo scoped storage e some
/// na desinstalação — portanto sem qualquer implicação nas políticas da Play
/// Store. Os arquivos continuam acessíveis por USB/MTP a partir de um PC, que
/// é como o suporte costuma recolhê-los.
class LogService extends GetxService {
  static const dirErrors = 'errors';
  static const dirHttp = 'http';
  static const dirGeral = 'geral';
  static const subDirs = [dirErrors, dirHttp, dirGeral];

  static const _rootDirName = 'logs';

  /// Teto de espaço em disco. Coletor tem armazenamento apertado e opera o dia
  /// inteiro; sem limite os logs crescem até encher o aparelho.
  static const _maxBytes = 20 * 1024 * 1024;

  /// Idade máxima dos arquivos. Além do teto de espaço, evita acumular meses
  /// de histórico irrelevante.
  static const _maxAge = Duration(days: 30);

  static const _headers = {
    dirErrors: 'hora;origem;erro;stacktrace',
    dirHttp: 'hora;request;payload;code;status;response',
    dirGeral: 'hora;origem;mensagem',
  };

  /// Marcação de conteúdo sensível: `>!conteudo!<` vira `******`.
  static final _maskMarker = RegExp(r'>!(.*?)!<', dotAll: true);

  /// Chaves cujo valor é mascarado automaticamente (query string `chave=valor`
  /// e JSON `"chave":"valor"`). Inclui os portadores de sessão: um JWT gravado
  /// em CSV no aparelho é credencial válida na mão de quem pegar o arquivo.
  static const _sensitiveKeys = [
    'senha',
    'password',
    'token',
    'access_token',
    'authorization',
    'chave',
    'x-api-key',
  ];

  Directory? _rootDir;

  /// Fila de escrita: serializa os appends para não intercalar linhas.
  Future<void> _pending = Future.value();

  Future<LogService> init() async {
    final root =
        await getExternalStorageDirectory() ??
        await getApplicationDocumentsDirectory();
    _rootDir = await Directory(
      '${root.path}${Platform.pathSeparator}$_rootDirName',
    ).create(recursive: true);

    await _compressOldFiles();
    await cleanOlderThan(idade: _maxAge);
    await cleanUntilHalf(limiteBytes: _maxBytes);

    info('LogService', 'init', 'Serviço de Log inicializado em ${_rootDir!.path}');
    return this;
  }

  // ------------------------------ Escrita ------------------------------

  void info(String tag, String subTag, String message) {
    _write(dirGeral, ['$tag | $subTag', message]);
  }

  void w(String tag, String subTag, String message) {
    _write(dirGeral, ['$tag | $subTag', '[AVISO] $message']);
  }

  void e({String? tag, String? subTag, Object? e}) {
    final origem = '${tag ?? ''} | ${subTag ?? ''}';
    if (e is Error) {
      _write(dirErrors, [origem, e.toString(), '${e.stackTrace ?? ''}']);
    } else {
      _write(dirErrors, [origem, e.toString(), '']);
    }
  }

  /// Requisições HTTP com erro (status fora de 2xx ou falha de rede).
  ///
  /// [request] no formato `MÉTODO url`. Em falhas sem resposta, [code] fica
  /// nulo e [status] descreve a falha (ex: 'Timeout').
  void http({
    required String request,
    String? payload,
    int? code,
    String? status,
    String? response,
  }) {
    _write(dirHttp, [
      _maskSensitive(request),
      _maskSensitive(payload ?? ''),
      code?.toString() ?? '',
      status ?? '',
      _maskSensitive(response ?? ''),
    ]);
  }

  void _write(String subDir, List<String> fields) {
    final root = _rootDir;
    final now = DateTime.now();
    final hora = DateFormat('HH:mm:ss').format(now);
    final masked = fields.map(
      (f) => f.replaceAllMapped(_maskMarker, (_) => '******'),
    );
    final line = [hora, ...masked].map(_csvField).join(';');

    if (kDebugMode) debugPrint('[$subDir] $line');

    // Chamadas antes do init() não têm onde gravar.
    if (root == null) return;

    final file = File(
      '${root.path}${Platform.pathSeparator}$subDir${Platform.pathSeparator}'
      '${subDir}_${DateFormat('dd-MM-yyyy').format(now)}.csv',
    );
    _pending = _pending.then((_) async {
      try {
        if (!await file.exists()) {
          await file.create(recursive: true);
          // BOM para o Excel reconhecer UTF-8 (acentos) ao abrir direto.
          await file.writeAsString(
            '﻿${_headers[subDir]}\n',
            mode: FileMode.append,
          );
        }
        await file.writeAsString('$line\n', mode: FileMode.append, flush: true);
      } catch (_) {
        // Falha ao gravar log não pode derrubar o fluxo chamador, e não há
        // onde registrá-la.
      }
    });
  }

  /// Escapa um campo CSV (RFC 4180): envolve em aspas quando contém o
  /// separador, aspas ou quebras de linha, dobrando aspas internas.
  String _csvField(String value) {
    if (!value.contains(';') &&
        !value.contains('"') &&
        !value.contains('\n') &&
        !value.contains('\r')) {
      return value;
    }
    return '"${value.replaceAll('"', '""')}"';
  }

  /// Mascara o valor das chaves sensíveis em query strings (`chave=valor`),
  /// corpos JSON (`"chave":"valor"`) e headers (`Authorization: Bearer x`).
  String _maskSensitive(String input) {
    var result = input;
    for (final key in _sensitiveKeys) {
      result = result.replaceAllMapped(
        RegExp('($key"?\\s*[=:]\\s*"?)(Bearer\\s+)?([^&";,}\\s]*)',
            caseSensitive: false),
        (m) => '${m[1]}${m[2] ?? ''}******',
      );
    }
    return result;
  }

  // ---------------------------- Manutenção -----------------------------

  /// Comprime (gzip) os arquivos de dias anteriores, preservando a data de
  /// modificação original — a limpeza por idade depende dela.
  Future<void> _compressOldFiles() async {
    final hoje = DateFormat('dd-MM-yyyy').format(DateTime.now());
    for (final file in await _logFiles(null)) {
      if (!file.path.endsWith('.csv') || file.path.endsWith('_$hoje.csv')) {
        continue;
      }
      try {
        final stat = await file.stat();
        final gz = File('${file.path}.gz');
        await gz.writeAsBytes(
          gzip.encode(await file.readAsBytes()),
          flush: true,
        );
        await file.delete();
        try {
          await gz.setLastModified(stat.modified);
        } catch (_) {}
      } catch (_) {
        // Arquivo problemático fica como está; nova tentativa no próximo boot.
      }
    }
  }

  /// Tamanho em bytes de cada subdiretório de logs.
  Future<Map<String, int>> directorySizes() async {
    final sizes = <String, int>{};
    for (final sub in subDirs) {
      sizes[sub] = await _dirSize(_subDirectory(sub));
    }
    return sizes;
  }

  Future<int> totalSize() async {
    final sizes = await directorySizes();
    return sizes.values.fold<int>(0, (a, b) => a + b);
  }

  /// Apaga arquivos mais antigos que [idade] em [subDir], ou em todos os
  /// subdiretórios quando nulo. [idade] nula apaga tudo.
  Future<void> cleanOlderThan({String? subDir, Duration? idade}) async {
    final cutoff = idade == null ? null : DateTime.now().subtract(idade);
    for (final file in await _logFiles(subDir)) {
      try {
        if (cutoff == null || (await file.lastModified()).isBefore(cutoff)) {
          await file.delete();
        }
      } catch (_) {}
    }
  }

  /// Apaga os arquivos mais antigos até o total caber em metade de
  /// [limiteBytes] — limpar até a borda faria a poda disparar a cada boot.
  Future<void> cleanUntilHalf({required int limiteBytes}) async {
    final alvo = limiteBytes ~/ 2;
    var total = await totalSize();
    if (total <= alvo) return;

    final files = await _logFiles(null);
    final stats = <(File, FileStat)>[for (final f in files) (f, await f.stat())]
      ..sort((a, b) => a.$2.modified.compareTo(b.$2.modified));

    for (final (file, stat) in stats) {
      if (total <= alvo) break;
      try {
        await file.delete();
        total -= stat.size;
      } catch (_) {}
    }
  }

  Directory _subDirectory(String sub) =>
      Directory('${_rootDir?.path}${Platform.pathSeparator}$sub');

  Future<List<File>> _logFiles(String? subDir) async {
    final dirs = subDir == null ? subDirs : [subDir];
    final files = <File>[];
    for (final sub in dirs) {
      final dir = _subDirectory(sub);
      if (!await dir.exists()) continue;
      await for (final entity in dir.list()) {
        if (entity is File) files.add(entity);
      }
    }
    return files;
  }

  Future<int> _dirSize(Directory dir) async {
    if (!await dir.exists()) return 0;
    var size = 0;
    await for (final entity in dir.list(recursive: true)) {
      if (entity is File) {
        try {
          size += await entity.length();
        } catch (_) {}
      }
    }
    return size;
  }
}
