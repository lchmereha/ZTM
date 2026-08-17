import 'dart:io';
import 'package:get/get.dart';
import 'package:ztm/src/services/log/log.dart';

/// Sends ZPL commands directly to a Zebra printer via TCP socket.
/// Used for client-side printing when the backend is deployed remotely
/// and cannot reach the printer's local network.
class ZplPrintService extends GetxService {
  final _log = Get.find<LogService>();

  /// Sends a list of ZPL command strings to the printer at [ip]:[port].
  /// Each command in [zplCommands] represents one label to be printed.
  /// Throws [SocketException] if the connection fails.
  Future<void> printZpl({
    required String ip,
    required int port,
    required List<String> zplCommands,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    _log.info(
      'ZplPrintService',
      'printZpl',
      'Conectando à impressora $ip:$port (${zplCommands.length} etiquetas)',
    );

    Socket? socket;
    try {
      socket = await Socket.connect(ip, port, timeout: timeout);

      // Send all ZPL commands joined by newline as a single payload,
      // matching the backend's behavior in zpl-print.service.ts
      final payload = zplCommands.join('\n');
      socket.write(payload);
      await socket.flush();

      // `flush` só esvazia o buffer do Dart; fechar em seguida pode cortar o
      // envio antes de a impressora receber tudo. `close()` faz o half-close e
      // o `done` só resolve quando o socket termina de drenar de verdade.
      await socket.close();
      await socket.done;
      socket = null;

      _log.info(
        'ZplPrintService',
        'printZpl',
        'Impressão enviada com sucesso (${zplCommands.length} etiquetas)',
      );
    } catch (e) {
      _log.e(
        tag: 'ZplPrintService',
        subTag: 'printZpl',
        e: 'Erro ao enviar ZPL para $ip:$port: $e',
      );
      rethrow;
    } finally {
      // Só entra aqui se o fechamento normal não aconteceu (erro no meio).
      socket?.destroy();
    }
  }
}
