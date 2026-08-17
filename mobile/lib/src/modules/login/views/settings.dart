import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ztm/src/components/barcode_scan.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/modules/login/controllers/settings.dart';
import 'package:ztm/src/services/settings/settings.dart';

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(SettingsController());

    final pages = [const _ScanSettingsView(), const _ManualSettingsView()];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Fechar',
          onPressed: () => Get.back(),
          icon: const Icon(Icons.close),
        ),
        title: const Text('Configurações de Conexão'),
        actions: [
          Obx(() {
            if (controller.selectedIndex.value != 1 ||
                !controller.isAuthenticated.value) {
              return const SizedBox.shrink();
            }
            return IconButton(
              tooltip: 'Salvar Configurações',
              icon: const Icon(Icons.save),
              onPressed: () => controller.saveManualSettings(),
            );
          }),
        ],
      ),
      body: Obx(
        () => IndexedStack(
          index: controller.selectedIndex.value,
          children: pages,
        ),
      ),
      bottomNavigationBar: Obx(
        () => BottomNavigationBar(
          currentIndex: controller.selectedIndex.value,
          onTap: controller.changePage,
          selectedItemColor: Get.theme.colorScheme.primary,
          unselectedItemColor: Get.theme.colorScheme.onSurfaceVariant,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.qr_code_scanner),
              label: 'Ler QR Code',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.edit_note),
              label: 'Manual',
            ),
          ],
        ),
      ),
    );
  }
}

class _ScanSettingsView extends GetView<SettingsController> {
  const _ScanSettingsView();

  @override
  Widget build(BuildContext context) {
    final settings = Get.find<SettingsService>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(Sizes.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Constants.borderRadius),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Sizes.lg),
              child: BarcodeScanField(
                listenOnly: true,
                onScan: (data) => controller.onScan(data),
              ),
            ),
          ),
          const SizedBox(height: Sizes.lg),
          Text(
            'Valores Atuais',
            style: Get.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: Sizes.sm),
          Obx(() {
            return Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Constants.borderRadius),
              ),
              child: Padding(
                padding: const EdgeInsets.all(Sizes.lg),
                child: Column(
                  children: [
                    _buildInfoRow(
                      'Protocolo',
                      settings.httpProtocol.value.toUpperCase(),
                    ),
                    const Divider(),
                    _buildInfoRow('Servidor', settings.servidor.value),
                    const Divider(),
                    _buildInfoRow(
                      'Porta',
                      settings.porta.value?.toString() ?? 'Padrão',
                    ),
                    const Divider(),
                    _buildInfoRow('Endpoint', settings.endpoint.value),
                    const Divider(),
                    _buildInfoRow('Timeout', '${settings.timeoutVal.value}s'),
                    const Divider(),
                    _buildInfoRow(
                      'Delimitador',
                      settings.delim.value ?? 'Nenhum',
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Sizes.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Get.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(value, style: Get.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _ManualSettingsView extends GetView<SettingsController> {
  const _ManualSettingsView();

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => controller.isAuthenticated.value ? _buildForm() : _buildAuth(),
    );
  }

  Widget _buildAuth() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(Sizes.lg),
        child: Form(
          key: controller.formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: Sizes.sm,
            children: [
              const Icon(Icons.lock_outline, size: 64),

              Text(
                'Acesso Restrito',
                style: Get.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  height: 1,
                ),
              ),

              Text(
                'Digite a senha para habilitar a configuração manual.',
                style: Get.textTheme.bodyMedium?.copyWith(height: 1),
                textAlign: TextAlign.center,
              ),

              SizedBox(
                width: 150,
                child: Obx(
                  () => TextFormField(
                    controller: controller.passwordController,
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      labelText: 'Senha',
                    ),
                    focusNode: controller.passwordFocusNode,
                    keyboardType: TextInputType.visiblePassword,
                    obscureText: controller.isPasswordObscured.value,
                    onFieldSubmitted: (_) => controller.authenticate(),
                    onTapOutside: (_) => controller.passwordFocusNode.unfocus(),
                    textAlign: TextAlign.center,
                    textCapitalization: TextCapitalization.characters,
                    textInputAction: TextInputAction.done,
                  ),
                ),
              ),

              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                spacing: Sizes.sm,
                children: [
                  Obx(
                    () => IconButton.filledTonal(
                      onPressed: controller.togglePasswordVisibility,
                      icon: Icon(
                        controller.isPasswordObscured.value
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                    ),
                  ),

                  IconButton.filled(
                    onPressed: () => controller.authenticate(),
                    icon: Icon(Icons.check),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(Sizes.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Parâmetros da Conexão',
            style: Get.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: Sizes.lg),
          Obx(
            () => SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'http', label: Text('HTTP')),
                ButtonSegment(value: 'https', label: Text('HTTPS')),
              ],
              selected: {controller.settings.httpProtocol.value},
              onSelectionChanged: (selecao) =>
                  controller.changeHttpProtocol(selecao.first),
              showSelectedIcon: false,
            ),
          ),
          const SizedBox(height: Sizes.md),
          TextFormField(
            controller: controller.serverController,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Servidor / IP',
              hintText: '192.168.0.100',
            ),
            keyboardType: TextInputType.url,
            textInputAction: TextInputAction.next,
            onFieldSubmitted: (_) => controller.portFocusNode.requestFocus(),
          ),
          const SizedBox(height: Sizes.md),
          TextFormField(
            controller: controller.portController,
            focusNode: controller.portFocusNode,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Porta',
              hintText: '3000',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            textInputAction: TextInputAction.next,
            onFieldSubmitted: (_) => controller.pathFocusNode.requestFocus(),
          ),
          const SizedBox(height: Sizes.md),
          TextFormField(
            controller: controller.pathController,
            focusNode: controller.pathFocusNode,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Caminho / Endpoint',
              hintText: '/api',
            ),
            textInputAction: TextInputAction.next,
            onFieldSubmitted: (_) => controller.timeoutFocusNode.requestFocus(),
          ),
          const SizedBox(height: Sizes.md),
          TextFormField(
            controller: controller.timeoutController,
            focusNode: controller.timeoutFocusNode,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Timeout (segundos)',
              hintText: '20',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            textInputAction: TextInputAction.next,
            onFieldSubmitted: (_) => controller.delimFocusNode.requestFocus(),
          ),
          const SizedBox(height: Sizes.md),
          TextFormField(
            controller: controller.delimController,
            focusNode: controller.delimFocusNode,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Delimitador Scanner',
              hintText: ';',
            ),
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => controller.saveManualSettings(),
          ),
          const SizedBox(height: Sizes.xl),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: Sizes.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
              ),
            ),
            icon: const Icon(Icons.save),
            label: const Text('SALVAR CONFIGURAÇÕES'),
            onPressed: () => controller.saveManualSettings(),
          ),
        ],
      ),
    );
  }
}
