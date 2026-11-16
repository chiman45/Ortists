import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/theme/widgets.dart';
import '../../../data/models/post.dart';
import '../providers/feed_providers.dart';
import '../widgets/post_card.dart';

enum _Tab { latest, popular }

/// Home feed: newest posts first (Latest) or most liked first (Popular), in a
/// two-column masonry grid. Pull down to refresh; more load as you scroll.
class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final _scroll = ScrollController();
  _Tab _tab = _Tab.latest;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 600) ref.read(feedProvider.notifier).loadMore();
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final feed = ref.watch(feedProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('ORTISTS', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        centerTitle: false,
        actions: [
          IconButton(
            key: const Key('open-search'),
            tooltip: 'Search',
            icon: const Icon(Icons.search_rounded),
            onPressed: () => context.push(Routes.search),
          ),
        ],
      ),
      body: feed.when(
        skipLoadingOnRefresh: true,
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _Message(
          icon: Icons.cloud_off_rounded,
          text: e is ApiException ? e.message : 'Could not load the feed.',
          action: SecondaryButton(label: 'Try again', onPressed: () => ref.invalidate(feedProvider)),
        ),
        data: (state) {
          // Latest keeps the server order; Popular sorts what is loaded by likes
          final posts = _tab == _Tab.latest
              ? state.posts
              : ([...state.posts]..sort((a, b) => b.likesCount.compareTo(a.likesCount)));
          return RefreshIndicator(
            color: c.accent,
            onRefresh: () => ref.refresh(feedProvider.future),
            child: CustomScrollView(
              controller: _scroll,
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(Insets.lg, Insets.sm, Insets.lg, Insets.md),
                    child: Row(
                      children: [
                        const Text('Feed', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        _tabButton('Latest', _Tab.latest),
                        _tabButton('Popular', _Tab.popular),
                      ],
                    ),
                  ),
                ),
                if (posts.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: _Message(
                      icon: Icons.palette_outlined,
                      text: 'No artwork yet. Be the first to post!',
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: Insets.md),
                    sliver: PostGrid(posts: posts),
                  ),
                SliverToBoxAdapter(child: _footer(state)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _tabButton(String label, _Tab tab) {
    final c = context.colors;
    final on = _tab == tab;
    return TextButton(
      key: Key('tab-$label'),
      onPressed: () => setState(() => _tab = tab),
      style: TextButton.styleFrom(
        foregroundColor: on ? c.text1 : c.text5,
        minimumSize: const Size(44, 44),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          const SizedBox(height: 3),
          Container(
            height: 2,
            width: 28,
            decoration: BoxDecoration(
              gradient: on ? c.primaryGradient : null,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _footer(FeedState state) {
    final c = context.colors;
    if (state.loadMoreError != null) {
      return Padding(
        padding: const EdgeInsets.all(Insets.lg),
        child: Column(
          children: [
            Text(state.loadMoreError!, style: TextStyle(color: c.text4, fontSize: 13)),
            TextButton(
              onPressed: () => ref.read(feedProvider.notifier).loadMore(),
              child: const Text('Try again'),
            ),
          ],
        ),
      );
    }
    if (state.loadingMore) {
      return const Padding(
        padding: EdgeInsets.all(Insets.xl),
        child: Center(
          child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)),
        ),
      );
    }
    return const SizedBox(height: Insets.xl);
  }
}

/// Two-column masonry grid of posts (a sliver). Tapping a card opens the post.
class PostGrid extends StatelessWidget {
  const PostGrid({super.key, required this.posts});

  final List<Post> posts;

  @override
  Widget build(BuildContext context) => SliverMasonryGrid.count(
    crossAxisCount: 2,
    mainAxisSpacing: Insets.md,
    crossAxisSpacing: Insets.md,
    childCount: posts.length,
    itemBuilder: (context, i) => PostCard(
      key: ValueKey(posts[i].id),
      post: posts[i],
      onTap: () => context.push(Routes.post(posts[i].id)),
    ),
  );
}

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Insets.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: c.text5),
            const SizedBox(height: Insets.md),
            Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyle(color: c.text3),
            ),
            if (action != null) ...[const SizedBox(height: Insets.lg), action!],
          ],
        ),
      ),
    );
  }
}
