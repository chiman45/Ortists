import 'package:flutter/material.dart';

import 'tokens.dart';

/// Purple-gradient primary button (Save, Buy now, Publish…), like the website.
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null && !loading;
    final child = Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (loading)
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        else if (icon != null)
          Icon(icon, size: 16, color: Colors.white),
        if (loading || icon != null) const SizedBox(width: Insets.sm),
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ],
    );

    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: c.primaryGradient,
          borderRadius: BorderRadius.circular(Radii.button),
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(Radii.button),
            onTap: enabled ? onPressed : null,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 44),
              child: Padding(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11), child: child),
            ),
          ),
        ),
      ),
    );
  }
}

/// Outlined secondary button (Share, Cancel, Upload photo…).
class SecondaryButton extends StatelessWidget {
  const SecondaryButton({super.key, required this.label, required this.onPressed, this.icon});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: icon == null ? null : Icon(icon, size: 16),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: c.text1,
        minimumSize: const Size(44, 44),
        side: BorderSide(color: c.border),
        backgroundColor: c.subtle,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.button)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}

/// Yellow Follow button used on every page (website `followStyle()`).
class FollowButton extends StatelessWidget {
  const FollowButton({super.key, required this.following, required this.onPressed});

  final bool following;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final y = c.followYellow;
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        minimumSize: const Size(44, 36),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        backgroundColor: following ? y.withValues(alpha: 0.12) : y,
        foregroundColor: following ? y : c.onFollow,
        side: BorderSide(color: following ? y.withValues(alpha: 0.45) : y),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.button)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
      ),
      child: Text(following ? 'Following' : 'Follow'),
    );
  }
}

/// Glass card surface (website GLASS pattern without the blur).
class GlassCard extends StatelessWidget {
  const GlassCard({super.key, required this.child, this.padding = const EdgeInsets.all(Insets.lg)});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: c.card,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.border),
      ),
      child: child,
    );
  }
}
