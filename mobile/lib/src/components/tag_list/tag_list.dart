import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ztm/src/constants/sizes.dart';
import 'package:ztm/src/models/scanned_tag_item.dart';
import 'package:ztm/src/utils/get_foreground_color.dart';

/// Larguras das colunas fixas. Header e linhas compartilham as mesmas
/// constantes — antes divergiam (50/40 no header, 46/30 nas linhas) e as
/// colunas apareciam desalinhadas.
const _rssiWidth = 46.0;
const _qtdWidth = 34.0;
const _columnSpacing = Sizes.xxs;

typedef TagValidator = TagValidationStatus Function(ScannedTagItem tag);

/// Lista de tags para uso embutido, em listas curtas e de tamanho conhecido
/// (ex.: as tags de um produto dentro de um `ExpansionTile`).
///
/// Para a tela de leitura, onde a lista cresce sem limite durante o scan, use
/// [TagListSliver] — este widget constrói todas as linhas de uma vez.
class TagListComponent extends StatelessWidget {
  final List<ScannedTagItem> tags;
  final TagValidator validator;
  final String emptyMessage;

  const TagListComponent({
    super.key,
    required this.tags,
    required this.validator,
    this.emptyMessage = 'Nenhuma tag escaneada.',
  });

  @override
  Widget build(BuildContext context) {
    if (tags.isEmpty) return _TagListEmpty(message: emptyMessage);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _TagListHeader(),
        ...List.generate(
          tags.length,
          (index) => _TagRow(
            tag: tags[index],
            isEven: index.isEven,
            validator: validator,
          ),
        ),
      ],
    );
  }
}

/// Versão em slivers da lista de tags, com reciclagem de linhas.
///
/// Durante a leitura contínua a lista chega a milhares de tags. A versão em
/// [Column]/`shrinkWrap` construía e mantinha em memória todas as linhas a cada
/// rebuild, o que trava e estoura a memória de coletores como o TC25 (2 GB).
class TagListSliver extends StatelessWidget {
  final List<ScannedTagItem> tags;
  final TagValidator validator;
  final String emptyMessage;

  const TagListSliver({
    super.key,
    required this.tags,
    required this.validator,
    this.emptyMessage = 'Nenhuma tag escaneada.',
  });

  @override
  Widget build(BuildContext context) {
    if (tags.isEmpty) {
      return SliverToBoxAdapter(child: _TagListEmpty(message: emptyMessage));
    }

    return SliverMainAxisGroup(
      slivers: [
        const SliverPersistentHeader(pinned: true, delegate: _StickyHeader()),
        SliverList.builder(
          itemCount: tags.length,
          itemBuilder: (context, index) => _TagRow(
            tag: tags[index],
            isEven: index.isEven,
            validator: validator,
          ),
        ),
      ],
    );
  }
}

TextStyle? _tagStyle(BuildContext context) =>
    Theme.of(context).textTheme.bodyMedium?.copyWith(fontFamily: 'UbuntuMono');

class _TagListEmpty extends StatelessWidget {
  final String message;

  const _TagListEmpty({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Sizes.md),
        child: Text(
          message,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

class _TagListHeader extends StatelessWidget {
  const _TagListHeader();

  static const height = 34.0;

  @override
  Widget build(BuildContext context) {
    final style = _tagStyle(context)?.copyWith(fontWeight: FontWeight.bold);

    return Container(
      height: height,
      color: Theme.of(context).colorScheme.primaryContainer,
      padding: const EdgeInsets.symmetric(horizontal: Sizes.md),
      alignment: Alignment.centerLeft,
      child: Row(
        spacing: _columnSpacing,
        children: [
          Expanded(child: Text('EPC', style: style)),
          SizedBox(
            width: _rssiWidth,
            child: Text('RSSI', style: style, textAlign: TextAlign.right),
          ),
          SizedBox(
            width: _qtdWidth,
            child: Text('Qtd.', style: style, textAlign: TextAlign.right),
          ),
        ],
      ),
    );
  }
}

/// Mantém o cabeçalho visível enquanto o operador rola a lista — numa tela de
/// 4", a lista ocupa quase tudo e o header sairia de vista no primeiro scroll.
class _StickyHeader extends SliverPersistentHeaderDelegate {
  const _StickyHeader();

  @override
  double get minExtent => _TagListHeader.height;

  @override
  double get maxExtent => _TagListHeader.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlaps) =>
      const _TagListHeader();

  @override
  bool shouldRebuild(_StickyHeader oldDelegate) => false;
}

class _TagRow extends StatelessWidget {
  final ScannedTagItem tag;
  final bool isEven;
  final TagValidator validator;

  const _TagRow({
    required this.tag,
    required this.isEven,
    required this.validator,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final baseStyle = _tagStyle(context);

    return Obx(() {
      final (rowColor, foregroundColor) = _colorsFor(
        validator(tag),
        colorScheme,
      );
      final rowStyle = baseStyle?.copyWith(color: foregroundColor);
      final background = isEven
          ? rowColor
          : Color.alphaBlend(
              colorScheme.scrim.withAlpha((0.2 * 255).round()),
              rowColor,
            );

      return Container(
        color: background,
        padding: const EdgeInsets.symmetric(
          vertical: Sizes.sm,
          horizontal: Sizes.md,
        ),
        child: Row(
          spacing: _columnSpacing,
          children: [
            Expanded(
              child: Text(
                tag.epc,
                style: rowStyle,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            SizedBox(
              width: _rssiWidth,
              child: Text(
                tag.rssi.value,
                overflow: TextOverflow.ellipsis,
                style: rowStyle,
                textAlign: TextAlign.right,
              ),
            ),
            SizedBox(
              width: _qtdWidth,
              child: Text(
                '${tag.count.value}',
                overflow: TextOverflow.ellipsis,
                style: rowStyle?.copyWith(fontWeight: FontWeight.bold),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        ),
      );
    });
  }

  (Color background, Color foreground) _colorsFor(
    TagValidationStatus status,
    ColorScheme colorScheme,
  ) {
    switch (status) {
      case TagValidationStatus.error:
        return Get.isDarkMode
            ? (colorScheme.errorContainer, colorScheme.onErrorContainer)
            : (colorScheme.error, colorScheme.onError);
      case TagValidationStatus.warning:
        return (Colors.orange, getForegroundColor(Colors.orange));
      case TagValidationStatus.ok:
        return (colorScheme.surface, colorScheme.onSurface);
    }
  }
}
