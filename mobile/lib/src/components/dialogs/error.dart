import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/constants.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/services/http/api_exception.dart';

class ErrorDialog extends StatefulWidget {
  final String? message;

  /// Plain-text details (legacy support).
  final String? detalhes;

  /// Structured field-level details from the backend.
  final List<ErrorDetail>? detalhesEstruturados;

  final List<Widget>? actions;

  const ErrorDialog({
    super.key,
    this.message,
    this.detalhes,
    this.detalhesEstruturados,
    this.actions,
  });

  /// Convenience constructor that extracts all fields from an [ApiException].
  factory ErrorDialog.fromApiException(ApiException e) {
    return ErrorDialog(message: e.message, detalhesEstruturados: e.detalhes);
  }

  @override
  State<ErrorDialog> createState() => _ErrorDialogState();
}

class _ErrorDialogState extends State<ErrorDialog> {
  bool _showDetails = false;

  bool get _hasDetails =>
      (widget.detalhes != null && widget.detalhes!.isNotEmpty) ||
      (widget.detalhesEstruturados != null &&
          widget.detalhesEstruturados!.isNotEmpty);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      scrollable: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Constants.borderRadius),
      ),
      title: Row(
        children: [
          Icon(Icons.error_outline, color: Get.theme.colorScheme.error),
          const SizedBox(width: Sizes.sm),
          Text(
            'Erro',
            style: Get.textTheme.titleMedium?.copyWith(
              color: Get.theme.colorScheme.error,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            widget.message ?? Constants.defaultErrorMessage,
            style: Get.textTheme.bodyMedium,
          ),
          if (_hasDetails) ...[
            const SizedBox(height: Sizes.md),
            InkWell(
              onTap: () {
                setState(() {
                  _showDetails = !_showDetails;
                });
              },
              borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: Sizes.xs),
                child: Row(
                  children: [
                    Text(
                      _showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes',
                      style: Get.textTheme.bodyMedium?.copyWith(
                        color: Get.theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Icon(
                      _showDetails ? Icons.expand_less : Icons.expand_more,
                      color: Get.theme.colorScheme.primary,
                    ),
                  ],
                ),
              ),
            ),
            if (_showDetails) ...[
              const SizedBox(height: Sizes.xs),
              _buildDetailsContent(),
            ],
          ],
        ],
      ),
      actions:
          widget.actions ??
          [
            FilledButton(
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    Constants.borderRadius / 2,
                  ),
                ),
              ),
              onPressed: () => Get.back(),
              child: const Text('OK'),
            ),
          ],
    );
  }

  Widget _buildDetailsContent() {
    // Structured details take priority
    if (widget.detalhesEstruturados != null &&
        widget.detalhesEstruturados!.isNotEmpty) {
      return Container(
        width: double.maxFinite,
        padding: const EdgeInsets.all(Sizes.md),
        decoration: BoxDecoration(
          color: Get.theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: widget.detalhesEstruturados!.map((detail) {
            return Padding(
              padding: const EdgeInsets.only(bottom: Sizes.xs),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (detail.campo.isNotEmpty)
                    Text(
                      detail.campo,
                      style: Get.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ...detail.erros.map(
                    (erro) => Padding(
                      padding: const EdgeInsets.only(left: Sizes.sm),
                      child: Text('• $erro', style: Get.textTheme.bodySmall),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      );
    }

    // Fallback to plain-text details
    return Container(
      width: double.maxFinite,
      padding: const EdgeInsets.all(Sizes.md),
      decoration: BoxDecoration(
        color: Get.theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(Constants.borderRadius / 2),
      ),
      child: Text(
        widget.detalhes!,
        style: Get.textTheme.bodySmall?.copyWith(fontFamily: 'UbuntuMono'),
      ),
    );
  }
}
