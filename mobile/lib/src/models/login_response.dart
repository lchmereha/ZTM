import 'dart:convert' show JsonEncoder;
import 'package:ztm/src/models/utils/parse_helpers.dart';

class LoginResponse {
  final String accessToken;
  final UserModel user;

  LoginResponse({required this.accessToken, required this.user});

  factory LoginResponse.fromJson(Map json) {
    return LoginResponse(
      accessToken: parseNullableString(json, 'access_token') ?? '',
      user: parseRequiredObject(json, 'user', (e) => UserModel.fromJson(e)),
    );
  }

  Map<String, Object?> toMap() => {
    'access_token': accessToken,
    'user': user.toMap(),
  };

  @override
  String toString() => JsonEncoder.withIndent('  ').convert(toMap());
}

class UserModel {
  final int id;
  final String nome;
  final String usuario;
  final String email;
  final String regra;
  final bool ativo;
  final CompanyModel? empresa;
  final List<CompanyModel> empresas;
  final List<FilialModel> filiais;
  final List<PermissaoModel> permissoes;

  UserModel({
    required this.id,
    required this.nome,
    required this.usuario,
    required this.email,
    required this.regra,
    required this.ativo,
    this.empresa,
    required this.empresas,
    required this.filiais,
    required this.permissoes,
  });

  factory UserModel.fromJson(Map json) {
    return UserModel(
      id: parseNullableInt(json, 'id') ?? 0,
      nome: parseNullableString(json, 'nome') ?? '',
      usuario: parseNullableString(json, 'usuario') ?? '',
      email: parseNullableString(json, 'email') ?? '',
      regra: parseNullableString(json, 'regra') ?? 'OPERADOR',
      ativo: parseNullableBool(json, 'ativo') ?? false,
      empresa: parseNullableObject(
        json,
        'empresa',
        (e) => CompanyModel.fromJson(e),
      ),
      empresas:
          parseNullableList(
            json,
            'empresas',
            (e) => CompanyModel.fromJson(e),
          ) ??
          [],
      filiais:
          parseNullableList(json, 'filiais', (e) => FilialModel.fromJson(e)) ??
          [],
      permissoes:
          parseNullableList(
            json,
            'permissoes',
            (e) => PermissaoModel.fromJson(e),
          ) ??
          [],
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'nome': nome,
    'usuario': usuario,
    'email': email,
    'regra': regra,
    'ativo': ativo,
    'empresa': empresa?.toMap(),
    'empresas': empresas.map((e) => e.toMap()).toList(),
    'filiais': filiais.map((e) => e.toMap()).toList(),
    'permissoes': permissoes.map((e) => e.toMap()).toList(),
  };
}

class CompanyModel {
  final int id;
  final String nome;
  final String? logo;
  final String? corEsquema;

  CompanyModel({
    required this.id,
    required this.nome,
    this.logo,
    this.corEsquema,
  });

  factory CompanyModel.fromJson(Map json) {
    return CompanyModel(
      id:
          parseNullableInt(json, 'id') ??
          parseNullableInt(json, 'idEmpresa') ??
          0,
      nome: parseNullableString(json, 'nome') ?? '',
      logo: parseNullableString(json, 'logo'),
      corEsquema: parseNullableString(json, 'corEsquema'),
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'nome': nome,
    'logo': logo,
    'corEsquema': corEsquema,
  };
}

class FilialModel {
  final int idFilial;
  final int idEmpresa;
  final String nome;

  FilialModel({
    required this.idFilial,
    required this.idEmpresa,
    required this.nome,
  });

  factory FilialModel.fromJson(Map json) {
    return FilialModel(
      idFilial:
          parseNullableInt(json, 'idFilial') ??
          parseNullableInt(json, 'id') ??
          0,
      idEmpresa: parseNullableInt(json, 'idEmpresa') ?? 0,
      nome: parseNullableString(json, 'nome') ?? '',
    );
  }

  Map<String, Object?> toMap() => {
    'idFilial': idFilial,
    'idEmpresa': idEmpresa,
    'nome': nome,
  };
}

class PermissaoModel {
  final int idOpcaoMenu;
  final String chave;
  final bool podeVisualizar;
  final bool podeIncluir;
  final bool podeAlterar;
  final bool podeExcluir;

  PermissaoModel({
    required this.idOpcaoMenu,
    required this.chave,
    required this.podeVisualizar,
    required this.podeIncluir,
    required this.podeAlterar,
    required this.podeExcluir,
  });

  factory PermissaoModel.fromJson(Map json) {
    return PermissaoModel(
      idOpcaoMenu: parseNullableInt(json, 'idOpcaoMenu') ?? 0,
      chave: parseNullableString(json, 'chave') ?? '',
      podeVisualizar: parseNullableBool(json, 'podeVisualizar') ?? false,
      podeIncluir: parseNullableBool(json, 'podeIncluir') ?? false,
      podeAlterar: parseNullableBool(json, 'podeAlterar') ?? false,
      podeExcluir: parseNullableBool(json, 'podeExcluir') ?? false,
    );
  }

  Map<String, Object?> toMap() => {
    'idOpcaoMenu': idOpcaoMenu,
    'chave': chave,
    'podeVisualizar': podeVisualizar,
    'podeIncluir': podeIncluir,
    'podeAlterar': podeAlterar,
    'podeExcluir': podeExcluir,
  };
}
