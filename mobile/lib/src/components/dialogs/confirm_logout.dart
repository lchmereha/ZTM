import 'package:get/get.dart';
import 'package:ztm/src/components/dialogs/boolean.dart';
import 'package:ztm/src/services/api/auth/auth_service.dart';

/// Pede confirmação antes de encerrar a sessão.
///
/// Existe como função compartilhada porque o logout é oferecido em três
/// lugares (menu da home, botão e item da seleção de filial) e a pergunta
/// precisa ser a mesma nos três. Só é chamada em ação iniciada pelo usuário —
/// o logout automático por sessão expirada não passa por aqui.
Future<void> confirmAndLogout() async {
  final confirmado = await Get.dialog<bool>(
    const BooleanDialog(
      title: 'Sair',
      content:
          'Deseja realmente encerrar a sessão? '
          'Será necessário informar usuário e senha novamente.',
      trueLabel: 'Sair',
      falseLabel: 'Cancelar',
    ),
  );

  if (confirmado != true) return;

  await Get.find<AuthService>().logout();
}
