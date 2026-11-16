import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/theme/tokens.dart';
import '../../../data/models/reaction.dart';
import '../../../data/repositories/post_repository.dart';
import '../../auth/widgets/login_prompt.dart';
import 'post_card.dart';

/// LinkedIn-style reaction button (same behaviour as the website):
///  - tap: ❤️, or remove your reaction if you already reacted
///  - press and hold: pick ❤️ 🔥 😂 😮 👏 🎨
/// Updates at once and puts the old value back if saving fails.
class ReactionButton extends ConsumerStatefulWidget {
  const ReactionButton({super.key, required this.postId, required this.initial});

  final String postId;
  final ReactionState initial;

  @override
  ConsumerState<ReactionButton> createState() => _ReactionButtonState();
}

class _ReactionButtonState extends ConsumerState<ReactionButton> {
  late ReactionState _state = widget.initial;
  bool _pending = false;
  final _picker = OverlayPortalController();
  final _link = LayerLink();

  @override
  void didUpdateWidget(ReactionButton old) {
    super.didUpdateWidget(old);
    // Fresh data from the server (e.g. after logging in) replaces local state
    if (!identical(old.initial, widget.initial) && !_pending) _state = widget.initial;
  }

  Future<void> _send(String? next) async {
    _picker.hide();
    if (_pending || !requireLogin(context, ref, action: 'react to artwork')) return;
    final before = _state;
    setState(() {
      _state = before.optimistic(next);
      _pending = true;
    });
    try {
      final saved = await ref.read(postRepositoryProvider).react(widget.postId, next);
      if (mounted) setState(() => _state = saved);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _state = before);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _pending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final mine = Reaction.of(_state.mine);
    final top = Reaction.top(_state.counts);
    final color = mine?.color ?? c.text3;

    return CompositedTransformTarget(
      link: _link,
      child: OverlayPortal(
        controller: _picker,
        overlayChildBuilder: (_) =>
            _Picker(link: _link, selected: _state.mine, onPick: _send, onClose: _picker.hide),
        child: Semantics(
          button: true,
          label: mine == null
              ? 'React. Tap for love, hold for more'
              : '${mine.label}. Tap to remove, hold to change',
          child: Material(
            color: mine == null ? c.subtle : mine.color.withValues(alpha: 0.12),
            shape: StadiumBorder(
              side: BorderSide(color: mine == null ? c.border : mine.color.withValues(alpha: 0.35)),
            ),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              key: const Key('reaction-button'),
              onTap: () => _send(mine == null ? Reaction.like.key : null),
              onLongPress: () {
                HapticFeedback.selectionClick();
                _picker.show();
              },
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 44),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (mine != null)
                        Text(mine.emoji, style: const TextStyle(fontSize: 16))
                      else
                        Icon(Icons.favorite_border_rounded, size: 18, color: color),
                      for (final r in top.where((r) => r.key != mine?.key))
                        Padding(
                          padding: const EdgeInsets.only(left: 2),
                          child: Text(r.emoji, style: const TextStyle(fontSize: 12)),
                        ),
                      const SizedBox(width: 6),
                      Text(
                        compactCount(_state.count),
                        key: const Key('reaction-count'),
                        style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The row of six emoji that floats just above the button.
class _Picker extends StatelessWidget {
  const _Picker({required this.link, required this.selected, required this.onPick, required this.onClose});

  final LayerLink link;
  final String? selected;
  final ValueChanged<String?> onPick;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Stack(
      children: [
        // Tap anywhere else to close
        Positioned.fill(
          child: GestureDetector(behavior: HitTestBehavior.opaque, onTap: onClose),
        ),
        CompositedTransformFollower(
          link: link,
          targetAnchor: Alignment.topLeft,
          followerAnchor: Alignment.bottomLeft,
          offset: const Offset(0, -8),
          child: Material(
            key: const Key('reaction-picker'),
            color: const Color(0xFF1C1C1C),
            elevation: 12,
            shape: StadiumBorder(side: BorderSide(color: c.border)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final r in Reaction.all)
                    Tooltip(
                      message: r.label,
                      child: InkResponse(
                        key: Key('react-${r.key}'),
                        radius: 24,
                        // Picking the one you already have removes it
                        onTap: () => onPick(selected == r.key ? null : r.key),
                        child: Container(
                          width: 44,
                          height: 44,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: selected == r.key ? r.color.withValues(alpha: 0.18) : null,
                          ),
                          child: Text(r.emoji, style: const TextStyle(fontSize: 24)),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
