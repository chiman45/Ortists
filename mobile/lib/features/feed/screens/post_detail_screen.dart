import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/auth/session.dart';
import '../../../core/config/env.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';
import '../../../data/models/comment.dart';
import '../../../data/models/post.dart';
import '../../../data/repositories/post_repository.dart';
import '../../auth/widgets/login_prompt.dart';
import '../providers/feed_providers.dart';
import '../widgets/post_card.dart';
import '../widgets/reaction_button.dart';
import 'feed_screen.dart';

/// One artwork: image, reactions, save, share, the artist with Follow,
/// details, comments, and "More like this". Guests can read everything.
class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({super.key, required this.postId});

  final String postId;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _commentFocus = FocusNode();
  final _comment = TextEditingController();
  bool? _saved; // null until the user taps (then it overrides the loaded value)
  bool _sending = false;

  @override
  void dispose() {
    _commentFocus.dispose();
    _comment.dispose();
    super.dispose();
  }

  void _snack(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  Future<void> _toggleSave(bool current) async {
    if (!requireLogin(context, ref, action: 'save artwork')) return;
    setState(() => _saved = !current);
    try {
      await ref.read(postRepositoryProvider).setSaved(widget.postId, saved: !current);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saved = current);
      _snack(e.message);
    }
  }

  Future<void> _sendComment() async {
    final text = _comment.text.trim();
    if (text.isEmpty || _sending) return;
    if (!requireLogin(context, ref, action: 'comment')) return;
    setState(() => _sending = true);
    try {
      await ref.read(commentsProvider(widget.postId).notifier).add(text);
      _comment.clear();
      _commentFocus.unfocus();
    } on ApiException catch (e) {
      if (mounted) _snack(e.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _share(Post post) => SharePlus.instance.share(
    ShareParams(
      uri: Uri.parse('${Env.siteUrl}/feed/${post.id}'),
      subject: '${post.title} by ${post.authorName} on Ortists',
    ),
  );

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final detail = ref.watch(postDetailProvider(widget.postId));
    return Scaffold(
      appBar: AppBar(),
      body: detail.when(
        skipLoadingOnReload: true,
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(Insets.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  e is ApiException && e.isNotFound
                      ? 'This artwork is no longer available.'
                      : (e is ApiException ? e.message : 'Could not load this artwork.'),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: c.text3),
                ),
                const SizedBox(height: Insets.lg),
                SecondaryButton(
                  label: 'Try again',
                  onPressed: () => ref.invalidate(postDetailProvider(widget.postId)),
                ),
              ],
            ),
          ),
        ),
        data: (d) => _body(d),
      ),
    );
  }

  Widget _body(PostDetail d) {
    final c = context.colors;
    final post = d.post;
    final saved = _saved ?? d.saved;
    final meta = [post.displayCategory, post.medium, post.dimensions, post.location].nonNulls.join(' · ');
    final related = ref.watch(relatedPostsProvider(post.id));

    return CustomScrollView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      slivers: [
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pinch to zoom
              for (final url in post.images)
                InteractiveViewer(maxScale: 4, child: ArtworkImage(url: url, placeholderHeight: 320)),
              Padding(
                padding: const EdgeInsets.all(Insets.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ReactionButton(postId: post.id, initial: d.reactions),
                        const SizedBox(width: Insets.sm),
                        _RoundIcon(
                          key: const Key('comment-button'),
                          icon: Icons.mode_comment_outlined,
                          tooltip: 'Comment',
                          onTap: _commentFocus.requestFocus,
                        ),
                        const SizedBox(width: Insets.sm),
                        _RoundIcon(
                          icon: Icons.ios_share_rounded,
                          tooltip: 'Share',
                          onTap: () => _share(post),
                        ),
                        const Spacer(),
                        _RoundIcon(
                          key: const Key('save-button'),
                          icon: saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                          tooltip: saved ? 'Saved' : 'Save',
                          color: saved ? c.accentText : null,
                          onTap: () => _toggleSave(saved),
                        ),
                      ],
                    ),
                    const SizedBox(height: Insets.lg),
                    Row(
                      children: [
                        Avatar(url: post.authorAvatar, size: 40),
                        const SizedBox(width: Insets.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                post.authorName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              if (post.authorUsername.isNotEmpty)
                                Text(
                                  '@${post.authorUsername.replaceFirst('@', '')}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(color: c.text4, fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                        FollowChip(userId: post.userId),
                      ],
                    ),
                    const SizedBox(height: Insets.lg),
                    Text(post.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    if (post.descriptionText != null) ...[
                      const SizedBox(height: Insets.sm),
                      Text(post.descriptionText!, style: TextStyle(color: c.text3, height: 1.45)),
                    ],
                    if (meta.isNotEmpty) ...[
                      const SizedBox(height: Insets.sm),
                      Text(
                        meta,
                        style: TextStyle(color: c.text4, fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ],
                    if (post.price != null) ...[
                      const SizedBox(height: Insets.lg),
                      GlassCard(
                        child: Row(
                          children: [
                            Text(
                              post.price!,
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                            ),
                            const Spacer(),
                            Text(
                              'Buying in the app is coming soon',
                              style: TextStyle(color: c.text4, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: Insets.xl),
                    if (post.allowComments)
                      _comments(post)
                    else
                      Text('Comments are off for this post.', style: TextStyle(color: c.text4)),
                    const SizedBox(height: Insets.xl),
                    const Text('More like this', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
        ),
        related.when(
          loading: () => const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(Insets.xl),
              child: Center(child: CircularProgressIndicator()),
            ),
          ),
          error: (_, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
          data: (posts) => SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: Insets.md),
            sliver: PostGrid(posts: posts),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: Insets.xxl)),
      ],
    );
  }

  Widget _comments(Post post) {
    final c = context.colors;
    final comments = ref.watch(commentsProvider(post.id));
    final count = comments.value?.length ?? post.commentsCount;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Comments ($count)', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: Insets.md),
        Row(
          children: [
            Expanded(
              child: TextField(
                key: const Key('comment-input'),
                controller: _comment,
                focusNode: _commentFocus,
                minLines: 1,
                maxLines: 4,
                maxLength: 2000,
                textCapitalization: TextCapitalization.sentences,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(hintText: 'Add a comment…', counterText: ''),
              ),
            ),
            const SizedBox(width: Insets.sm),
            IconButton.filled(
              key: const Key('comment-send'),
              tooltip: 'Post comment',
              onPressed: _comment.text.trim().isEmpty || _sending ? null : _sendComment,
              icon: _sending
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send_rounded, size: 18),
            ),
          ],
        ),
        const SizedBox(height: Insets.md),
        comments.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(Insets.lg),
            child: Center(
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            ),
          ),
          error: (_, _) => TextButton(
            onPressed: () => ref.invalidate(commentsProvider(post.id)),
            child: const Text('Could not load comments. Try again'),
          ),
          data: (list) => list.isEmpty
              ? Text('No comments yet. Say something nice!', style: TextStyle(color: c.text4, fontSize: 13))
              : Column(children: [for (final cm in list) _CommentTile(comment: cm)]),
        ),
      ],
    );
  }
}

/// Yellow Follow / Following button for one user. Hidden on your own posts.
class FollowChip extends ConsumerWidget {
  const FollowChip({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (userId.isEmpty || ref.watch(viewerIdProvider) == userId) return const SizedBox.shrink();
    final following = ref.watch(followProvider(userId)).value ?? false;
    return FollowButton(
      key: const Key('follow-button'),
      following: following,
      onPressed: () async {
        if (!requireLogin(context, ref, action: 'follow artists')) return;
        final messenger = ScaffoldMessenger.of(context);
        try {
          await ref.read(followProvider(userId).notifier).toggle();
        } on ApiException catch (e) {
          messenger.showSnackBar(SnackBar(content: Text(e.message)));
        }
      },
    );
  }
}

class _CommentTile extends StatelessWidget {
  const _CommentTile({required this.comment});

  final Comment comment;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.only(bottom: Insets.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Avatar(url: comment.authorAvatar, size: 28),
          const SizedBox(width: Insets.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(comment.authorName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(comment.text, style: TextStyle(color: c.text2, fontSize: 14, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIcon extends StatelessWidget {
  const _RoundIcon({super.key, required this.icon, required this.tooltip, required this.onTap, this.color});

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return IconButton(
      tooltip: tooltip,
      onPressed: onTap,
      icon: Icon(icon, size: 20, color: color ?? c.text2),
      style: IconButton.styleFrom(
        backgroundColor: c.subtle,
        minimumSize: const Size(44, 44),
        side: BorderSide(color: c.border),
      ),
    );
  }
}
