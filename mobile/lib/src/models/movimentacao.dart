import 'dart:convert' show JsonEncoder;
import 'package:ztm/src/models/utils/parse_helpers.dart';

class Movimentacao {
  final int id;
  final int idFilial;
  final int? idUsuario;
  final int idTipoMovimentacao;
  final int? idEquipamento;
  final String? descricao;
  final String? codigoIntegracao;
  final String situacao; // 'CRIADO', 'IMPORTADO', 'PROCESSADO', 'FINALIZADO'
  final String? dataProcessamento;
  final String createdAt;
  final TipoMovimentacao tipo;
  final EquipamentoModel? equipamento;
  final List<ImportacaoItemModel> importacaoItens;
  final List<MovimentacaoItemModel> itens;

  Movimentacao({
    required this.id,
    required this.idFilial,
    this.idUsuario,
    required this.idTipoMovimentacao,
    this.idEquipamento,
    this.descricao,
    this.codigoIntegracao,
    required this.situacao,
    this.dataProcessamento,
    required this.createdAt,
    required this.tipo,
    this.equipamento,
    required this.importacaoItens,
    required this.itens,
  });

  factory Movimentacao.fromJson(Map json) {
    return Movimentacao(
      id: parseNullableInt(json, 'id') ?? 0,
      idFilial:
          parseNullableInt(json, 'idFilial') ??
          parseNullableInt(json, 'id_filial') ??
          0,
      idUsuario:
          parseNullableInt(json, 'idUsuario') ??
          parseNullableInt(json, 'id_usuario'),
      idTipoMovimentacao:
          parseNullableInt(json, 'idTipoMovimentacao') ??
          parseNullableInt(json, 'id_tipo_movimentacao') ??
          0,
      idEquipamento:
          parseNullableInt(json, 'idEquipamento') ??
          parseNullableInt(json, 'id_equipamento'),
      descricao: parseNullableString(json, 'descricao'),
      codigoIntegracao:
          parseNullableString(json, 'codigoIntegracao') ??
          parseNullableString(json, 'codigo_integracao'),
      situacao: parseNullableString(json, 'situacao') ?? 'CRIADO',
      dataProcessamento:
          parseNullableString(json, 'dataProcessamento') ??
          parseNullableString(json, 'data_processamento'),
      createdAt:
          parseNullableString(json, 'createdAt') ??
          parseNullableString(json, 'created_at') ??
          '',
      tipo: parseRequiredObject(
        json,
        'tipo',
        (e) => TipoMovimentacao.fromJson(e),
      ),
      equipamento: parseNullableObject(
        json,
        'equipamento',
        (e) => EquipamentoModel.fromJson(e),
      ),
      importacaoItens:
          parseNullableList(
            json,
            'importacaoItens',
            (e) => ImportacaoItemModel.fromJson(e),
          ) ??
          parseNullableList(
            json,
            'importacao_itens',
            (e) => ImportacaoItemModel.fromJson(e),
          ) ??
          [],
      itens:
          parseNullableList(
            json,
            'itens',
            (e) => MovimentacaoItemModel.fromJson(e),
          ) ??
          [],
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'idFilial': idFilial,
    'idUsuario': idUsuario,
    'idTipoMovimentacao': idTipoMovimentacao,
    'idEquipamento': idEquipamento,
    'descricao': descricao,
    'codigoIntegracao': codigoIntegracao,
    'situacao': situacao,
    'dataProcessamento': dataProcessamento,
    'createdAt': createdAt,
    'tipo': tipo.toMap(),
    'equipamento': equipamento?.toMap(),
    'importacaoItens': importacaoItens.map((e) => e.toMap()).toList(),
    'itens': itens.map((e) => e.toMap()).toList(),
  };

  @override
  String toString() => JsonEncoder.withIndent('  ').convert(toMap());
}

class TipoMovimentacao {
  final int id;
  final int idEmpresa;
  final String descricao;
  final bool ativo;
  final bool fazBaixa;
  final String tipo; // 'IMPRESSAO', 'ASSOCIACAO', 'LEITURA', 'CONFERENCIA'

  TipoMovimentacao({
    required this.id,
    required this.idEmpresa,
    required this.descricao,
    required this.ativo,
    required this.fazBaixa,
    required this.tipo,
  });

  factory TipoMovimentacao.fromJson(Map json) {
    return TipoMovimentacao(
      id: parseNullableInt(json, 'id') ?? 0,
      idEmpresa:
          parseNullableInt(json, 'idEmpresa') ??
          parseNullableInt(json, 'id_empresa') ??
          0,
      descricao: parseNullableString(json, 'descricao') ?? '',
      ativo: parseNullableBool(json, 'ativo') ?? true,
      fazBaixa:
          parseNullableBool(json, 'fazBaixa') ??
          parseNullableBool(json, 'faz_baixa') ??
          false,
      tipo: parseNullableString(json, 'tipo') ?? 'LEITURA',
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'idEmpresa': idEmpresa,
    'descricao': descricao,
    'ativo': ativo,
    'fazBaixa': fazBaixa,
    'tipo': tipo,
  };
}

class EquipamentoModel {
  final int id;
  final int idFilial;
  final String nome;
  final String? ipConexao;
  final int? portaConexao;
  final bool ativo;
  final String tipo; // 'IMPRESSORA', 'ANTENA', 'SLED'
  final bool exibeConexaoSocket;

  EquipamentoModel({
    required this.id,
    required this.idFilial,
    required this.nome,
    this.ipConexao,
    this.portaConexao,
    required this.ativo,
    required this.tipo,
    required this.exibeConexaoSocket,
  });

  factory EquipamentoModel.fromJson(Map json) {
    return EquipamentoModel(
      id: parseNullableInt(json, 'id') ?? 0,
      idFilial:
          parseNullableInt(json, 'idFilial') ??
          parseNullableInt(json, 'id_filial') ??
          0,
      nome: parseNullableString(json, 'nome') ?? '',
      ipConexao:
          parseNullableString(json, 'ipConexao') ??
          parseNullableString(json, 'ip_conexao'),
      portaConexao:
          parseNullableInt(json, 'portaConexao') ??
          parseNullableInt(json, 'porta_conexao'),
      ativo: parseNullableBool(json, 'ativo') ?? true,
      tipo: parseNullableString(json, 'tipo') ?? 'SLED',
      exibeConexaoSocket:
          parseNullableBool(json, 'exibeConexaoSocket') ??
          parseNullableBool(json, 'exibe_conexao_socket') ??
          false,
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'idFilial': idFilial,
    'nome': nome,
    'ipConexao': ipConexao,
    'portaConexao': portaConexao,
    'ativo': ativo,
    'tipo': tipo,
    'exibeConexaoSocket': exibeConexaoSocket,
  };
}

class ImportacaoItemModel {
  final int id;
  final int idMovimentacao;
  final String codigo;
  final String? nome;
  final String? unidadeMedida;
  final int quantidade;
  final String? categoria;
  final String? codigoUnico;
  final String? dataValidade;
  final String? lote;
  final String? dataFabricacao;

  ImportacaoItemModel({
    required this.id,
    required this.idMovimentacao,
    required this.codigo,
    this.nome,
    this.unidadeMedida,
    required this.quantidade,
    this.categoria,
    this.codigoUnico,
    this.dataValidade,
    this.lote,
    this.dataFabricacao,
  });

  factory ImportacaoItemModel.fromJson(Map json) {
    return ImportacaoItemModel(
      id: parseNullableInt(json, 'id') ?? 0,
      idMovimentacao:
          parseNullableInt(json, 'idMovimentacao') ??
          parseNullableInt(json, 'id_movimentacao') ??
          0,
      codigo: parseNullableString(json, 'codigo') ?? '',
      nome: parseNullableString(json, 'nome'),
      unidadeMedida:
          parseNullableString(json, 'unidadeMedida') ??
          parseNullableString(json, 'unidade_medida'),
      quantidade: parseNullableInt(json, 'quantidade') ?? 1,
      categoria: parseNullableString(json, 'categoria'),
      codigoUnico:
          parseNullableString(json, 'codigoUnico') ??
          parseNullableString(json, 'codigo_unico'),
      dataValidade:
          parseNullableString(json, 'dataValidade') ??
          parseNullableString(json, 'data_validade'),
      lote: parseNullableString(json, 'lote'),
      dataFabricacao:
          parseNullableString(json, 'dataFabricacao') ??
          parseNullableString(json, 'data_fabricacao'),
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'idMovimentacao': idMovimentacao,
    'codigo': codigo,
    'nome': nome,
    'unidadeMedida': unidadeMedida,
    'quantidade': quantidade,
    'categoria': categoria,
    'codigoUnico': codigoUnico,
    'dataValidade': dataValidade,
    'lote': lote,
    'dataFabricacao': dataFabricacao,
  };
}

class TagRfidModel {
  final int id;
  final int idFilial;
  final int idProduto;
  final String codigoRfid;
  final String? codigoUnico;
  final String? dataValidade;
  final String? lote;
  final String? dataFabricacao;
  final String? dataBaixa;

  TagRfidModel({
    required this.id,
    required this.idFilial,
    required this.idProduto,
    required this.codigoRfid,
    this.codigoUnico,
    this.dataValidade,
    this.lote,
    this.dataFabricacao,
    this.dataBaixa,
  });

  factory TagRfidModel.fromJson(Map json) {
    return TagRfidModel(
      id: parseNullableInt(json, 'id') ?? 0,
      idFilial:
          parseNullableInt(json, 'idFilial') ??
          parseNullableInt(json, 'id_filial') ??
          0,
      idProduto:
          parseNullableInt(json, 'idProduto') ??
          parseNullableInt(json, 'id_produto') ??
          0,
      codigoRfid:
          parseNullableString(json, 'codigoRfid') ??
          parseNullableString(json, 'codigo_rfid') ??
          '',
      codigoUnico:
          parseNullableString(json, 'codigoUnico') ??
          parseNullableString(json, 'codigo_unico'),
      dataValidade:
          parseNullableString(json, 'dataValidade') ??
          parseNullableString(json, 'data_validade'),
      lote: parseNullableString(json, 'lote'),
      dataFabricacao:
          parseNullableString(json, 'dataFabricacao') ??
          parseNullableString(json, 'data_fabricacao'),
      dataBaixa:
          parseNullableString(json, 'dataBaixa') ??
          parseNullableString(json, 'data_baixa'),
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'idFilial': idFilial,
    'idProduto': idProduto,
    'codigoRfid': codigoRfid,
    'codigoUnico': codigoUnico,
    'dataValidade': dataValidade,
    'lote': lote,
    'dataFabricacao': dataFabricacao,
    'dataBaixa': dataBaixa,
  };
}

class MovimentacaoItemModel {
  final int id;
  final int idMovimentacao;
  final int? idTagRfid;
  final String? codigoRfid;
  final String
  ocorrencia; // 'LEITURA', 'INCLUSAO', 'ENCONTRADO', 'NAO_ENCONTRADO'
  final TagRfidModel? tagRfid;

  MovimentacaoItemModel({
    required this.id,
    required this.idMovimentacao,
    this.idTagRfid,
    this.codigoRfid,
    required this.ocorrencia,
    this.tagRfid,
  });

  factory MovimentacaoItemModel.fromJson(Map json) {
    return MovimentacaoItemModel(
      id: parseNullableInt(json, 'id') ?? 0,
      idMovimentacao:
          parseNullableInt(json, 'idMovimentacao') ??
          parseNullableInt(json, 'id_movimentacao') ??
          0,
      idTagRfid:
          parseNullableInt(json, 'idTagRfid') ??
          parseNullableInt(json, 'id_tag_rfid'),
      codigoRfid:
          parseNullableString(json, 'codigoRfid') ??
          parseNullableString(json, 'codigo_rfid'),
      ocorrencia: parseNullableString(json, 'ocorrencia') ?? 'LEITURA',
      tagRfid:
          parseNullableObject(
            json,
            'tagRfid',
            (e) => TagRfidModel.fromJson(e),
          ) ??
          parseNullableObject(
            json,
            'tag_rfid',
            (e) => TagRfidModel.fromJson(e),
          ),
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'idMovimentacao': idMovimentacao,
    'idTagRfid': idTagRfid,
    'codigoRfid': codigoRfid,
    'ocorrencia': ocorrencia,
    'tagRfid': tagRfid?.toMap(),
  };
}
