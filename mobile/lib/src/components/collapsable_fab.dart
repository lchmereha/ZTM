import 'package:flutter/material.dart';
import 'package:get/get.dart';

/// Controller for [CollapsableFab].
///
/// Manages the expanded/collapsed reactive state. The animation itself
/// is driven by a [StatefulWidget] since [AnimationController] needs a
/// [TickerProvider], which requires the widget tree.
class CollapsableFabController extends GetxController {
  /// Whether the FAB is currently in its expanded (extended) form.
  final isExpanded = false.obs;

  /// The initial expanded state passed from the widget.
  final bool initiallyExpanded;

  CollapsableFabController({this.initiallyExpanded = false});

  @override
  void onInit() {
    super.onInit();
    isExpanded.value = initiallyExpanded;
  }

  /// Toggles between expanded and collapsed states.
  void toggle() => isExpanded.toggle();

  /// Expands the FAB to its extended form.
  void expand() {
    if (!isExpanded.value) isExpanded.value = true;
  }

  /// Collapses the FAB to its compact form.
  void collapse() {
    if (isExpanded.value) isExpanded.value = false;
  }
}

/// A [FloatingActionButton] that toggles between its compact and extended
/// forms on a long press.
///
/// In the **collapsed** state it renders a standard [FloatingActionButton]
/// showing only the [icon]. In the **expanded** state it renders a
/// [FloatingActionButton.extended] displaying both the [icon] and [label].
///
/// The transition between states is animated with a smooth size/opacity change.
///
/// {@tool snippet}
/// ```dart
/// CollapsableFab(
///   icon: const Icon(Icons.add),
///   label: const Text('Novo item'),
///   onPressed: () => print('pressed'),
/// )
/// ```
/// {@end-tool}
class CollapsableFab extends StatefulWidget {
  /// The label displayed when the FAB is expanded.
  final Widget label;

  /// The icon displayed in both states.
  final Widget icon;

  /// Called when the FAB is tapped.
  final VoidCallback? onPressed;

  /// Whether the FAB starts in its expanded state.
  ///
  /// Defaults to `false` (collapsed).
  final bool initiallyExpanded;

  /// An optional tag to allow multiple independent instances via GetX.
  final String? tag;

  /// Optional tooltip for accessibility.
  final String? tooltip;

  /// Optional background color override.
  final Color? backgroundColor;

  /// Optional foreground color override.
  final Color? foregroundColor;

  /// Optional elevation override.
  final double? elevation;

  /// Optional hero tag. Set to `null` to disable the hero animation
  /// (useful when multiple FABs exist on the same screen).
  final Object? heroTag;

  /// Optional shape override for the FAB.
  final ShapeBorder? shape;

  const CollapsableFab({
    super.key,
    required this.label,
    required this.icon,
    this.onPressed,
    this.initiallyExpanded = false,
    this.tag,
    this.tooltip,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
    this.heroTag,
    this.shape,
  });

  @override
  State<CollapsableFab> createState() => _CollapsableFabState();
}

class _CollapsableFabState extends State<CollapsableFab>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animationController;
  late final Animation<double> _expandAnimation;
  late final CollapsableFabController _controller;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );

    _expandAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );

    final tag = widget.tag ?? widget.hashCode.toString();
    _controller = Get.put(
      CollapsableFabController(initiallyExpanded: widget.initiallyExpanded),
      tag: tag,
    );

    if (_controller.isExpanded.value) {
      _animationController.value = 1.0;
    }

    // Sync animation with reactive state.
    _controller.isExpanded.listen((expanded) {
      if (expanded) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: _controller.toggle,
      child: AnimatedBuilder(
        listenable: _expandAnimation,
        label: widget.label,
        icon: widget.icon,
        onPressed: widget.onPressed,
        tooltip: widget.tooltip,
        backgroundColor: widget.backgroundColor,
        foregroundColor: widget.foregroundColor,
        elevation: widget.elevation,
        heroTag: widget.heroTag,
        shape: widget.shape,
      ),
    );
  }
}

/// Internal widget that rebuilds whenever the expand animation ticks,
/// smoothly transitioning between the compact and extended FAB forms.
class AnimatedBuilder extends AnimatedWidget {
  final Widget label;
  final Widget icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;
  final Object? heroTag;
  final ShapeBorder? shape;

  const AnimatedBuilder({
    super.key,
    required super.listenable,
    required this.label,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
    this.heroTag,
    this.shape,
  });

  Animation<double> get _progress => listenable as Animation<double>;

  @override
  Widget build(BuildContext context) {
    // When the animation is at 0 the FAB is fully collapsed;
    // when at 1 it is fully extended. We cross-fade at the midpoint
    // to avoid layout jumps.
    final isExtended = _progress.value > 0.5;

    if (isExtended) {
      return FloatingActionButton.extended(
        onPressed: onPressed,
        icon: icon,
        label: _AnimatedLabel(progress: _progress, child: label),
        tooltip: tooltip,
        backgroundColor: backgroundColor,
        foregroundColor: foregroundColor,
        elevation: elevation,
        heroTag: heroTag,
        shape: shape,
      );
    }

    return FloatingActionButton(
      onPressed: onPressed,
      tooltip: tooltip,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      elevation: elevation,
      heroTag: heroTag,
      shape: shape,
      child: icon,
    );
  }
}

/// Animates the label's width and opacity during the expand/collapse
/// transition to avoid abrupt visual jumps.
class _AnimatedLabel extends StatelessWidget {
  final Animation<double> progress;
  final Widget child;

  const _AnimatedLabel({required this.progress, required this.child});

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: Align(
        alignment: AlignmentDirectional.centerStart,
        widthFactor: progress.value.clamp(0.0, 1.0),
        child: Opacity(opacity: progress.value.clamp(0.0, 1.0), child: child),
      ),
    );
  }
}
