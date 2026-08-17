import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:rfid_reader/bluetooth/rfid_bluetooth_device.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/rfid/rfid.dart';

class BleScanController extends GetxController {
  final rfidService = Get.find<RfidService>();

  final scannedDevices = <RfidBluetoothDevice>[].obs;
  final unnamedDevices = <RfidBluetoothDevice>[].obs;
  final isScanning = false.obs;

  @override
  void onInit() {
    super.onInit();
    startScan();
  }

  @override
  void onClose() {
    stopScan();
    super.onClose();
  }

  Future<void> startScan() async {
    if (isScanning.value) return;

    final statuses = await [
      Permission.location,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
    ].request();

    if (statuses[Permission.location]?.isGranted != true &&
        statuses[Permission.bluetoothScan]?.isGranted != true) {
      return;
    }

    scannedDevices.clear();
    unnamedDevices.clear();

    isScanning.value = true;

    try {
      FlutterBluePlus.startScan();

      // Auto-stop scan after 10 seconds
      Future.delayed(const Duration(seconds: 10), stopScan);
    } catch (_) {}
  }

  void stopScan() {
    if (!isScanning.value) return;

    FlutterBluePlus.stopScan();
    isScanning.value = false;
  }
}

class BleScanDialog extends StatelessWidget {
  const BleScanDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BleScanController());

    return AlertDialog(
      title: Text('Conectar', style: Get.textTheme.titleLarge),
      content: DefaultTabController(
        length: 2,
        child: Column(
          children: [
            Obx(
              () => controller.isScanning.value
                  ? const LinearProgressIndicator()
                  : const SizedBox.shrink(),
            ),

            const TabBar(
              labelPadding: EdgeInsets.zero,
              tabs: [
                Tab(text: 'Encontrados', icon: Icon(Icons.bluetooth_searching)),
                Tab(text: 'Sem Nome', icon: Icon(Icons.subtitles_off_outlined)),
              ],
            ),

            Expanded(
              child: StreamBuilder(
                stream: FlutterBluePlus.scanResults,
                builder: (context, snapshot) {
                  final results = snapshot.data;

                  for (final result in results ?? []) {
                    final device = RfidBluetoothDevice(
                      address: result.device.remoteId.str,
                      name: result.device.platformName,
                      rssi: result.rssi,
                    );

                    if (device.name.isEmpty) {
                      if (!controller.unnamedDevices.any(
                        (d) => d.address == device.address,
                      )) {
                        controller.unnamedDevices.add(device);
                      }
                    } else {
                      if (!controller.scannedDevices.any(
                        (d) => d.address == device.address,
                      )) {
                        controller.scannedDevices.add(device);
                      }
                    }
                  }

                  return TabBarView(
                    children: [
                      _DeviceList(devices: controller.scannedDevices),
                      _DeviceList(devices: controller.unnamedDevices),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton.icon(
          onPressed: () {
            if (controller.isScanning.value) {
              controller.stopScan();
            } else {
              controller.startScan();
            }
          },
          icon: Obx(
            () =>
                Icon(controller.isScanning.value ? Icons.stop : Icons.refresh),
          ),
          label: Obx(
            () => Text(
              controller.isScanning.value ? 'Parar' : 'Buscar Novamente',
            ),
          ),
        ),
      ],
    );
  }
}

class _DeviceList extends GetView<BleScanController> {
  final RxList<RfidBluetoothDevice> devices;

  const _DeviceList({required this.devices});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (devices.isEmpty) {
        return const Center(child: Text('Nenhum dispositivo encontrado.'));
      }
      return ListView.separated(
        itemCount: devices.length,
        padding: const EdgeInsets.all(Sizes.xs),
        shrinkWrap: true,
        separatorBuilder: (_, _) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final device = devices[i];
          return ListTile(
            dense: true,
            contentPadding: EdgeInsets.symmetric(horizontal: Sizes.xs),
            visualDensity: VisualDensity.compact,
            title: device.name.isNotEmpty
                ? Text(
                    device.name.isEmpty ? '(Sem Nome)' : device.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Get.textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
            subtitle: Text(
              device.address,
              style: Get.textTheme.bodySmall?.copyWith(
                fontFamily: 'UbuntuMono',
              ),
            ),
            onTap: () {
              controller.stopScan();
              Get.back(result: device);
            },
          );
        },
      );
    });
  }
}
