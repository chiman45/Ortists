import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/auth/session.dart';
import '../../../data/models/comment.dart';
import '../../../data/models/post.dart';
import '../../../data/repositories/post_repository.dart';

/// The signed-in user's id (null for guests). Providers that return "what did
/// *I* do" watch this so they reload after login/logout.
final viewerIdProvider = Provider<String?>((ref) => ref.watch(sessionProvider).value?.user?.id);

@immutable
class FeedState {
  const FeedState({required this.posts, required this.hasMore, this.loadingMore = false, this.loadMoreError});

  final List<Post> posts;
  final bool hasMore;
  final bool loadingMore;

  /// Set when fetching the next page failed (the posts already shown stay).
  final String? loadMoreError;
}

final feedProvider = AsyncNotifierProvider<FeedNotifier, FeedState>(FeedNotifier.new);

/// The feed, newest first, loaded a page at a time.
class FeedNotifier extends AsyncNotifier<FeedState> {
  static const pageSize = 24;

  @override
  Future<FeedState> build() async {
    final page = await ref.watch(postRepositoryProvider).list(limit: pageSize);
    return FeedState(posts: page.posts, hasMore: page.hasMore);
  }

  Future<void> loadMore() async {
    final cur = state.value;
    if (cur == null || !cur.hasMore || cur.loadingMore) return;
    state = AsyncData(FeedState(posts: cur.posts, hasMore: true, loadingMore: true));
    try {
      final page = await ref.read(postRepositoryProvider).list(limit: pageSize, offset: cur.posts.length);
      // A new post published meanwhile shifts the pages by one: drop repeats
      final seen = {for (final p in cur.posts) p.id};
      final fresh = page.posts.where((p) => seen.add(p.id));
      state = AsyncData(FeedState(posts: [...cur.posts, ...fresh], hasMore: page.hasMore));
    } on ApiException catch (e) {
      state = AsyncData(FeedState(posts: cur.posts, hasMore: true, loadMoreError: e.message));
    }
  }
}

/// A post with the viewer's own reaction and saved state.
final postDetailProvider = FutureProvider.autoDispose.family<PostDetail, String>((ref, id) {
  ref.watch(viewerIdProvider);
  return ref.watch(postRepositoryProvider).detail(id);
});

/// "More like this": same category first, topped up with the latest posts.
final relatedPostsProvider = FutureProvider.autoDispose.family<List<Post>, String>((ref, id) async {
  final repo = ref.watch(postRepositoryProvider);
  final post = (await ref.watch(postDetailProvider(id).future)).post;
  final same = post.category == null
      ? const <Post>[]
      : (await repo.list(category: post.category)).posts.where((p) => p.id != id).toList();
  if (same.length >= 8) return same;
  final seen = {id, for (final p in same) p.id};
  final latest = (await repo.list()).posts.where((p) => seen.add(p.id));
  return [...same, ...latest].take(24).toList();
});

final commentsProvider = AsyncNotifierProvider.autoDispose.family<CommentsNotifier, List<Comment>, String>(
  CommentsNotifier.new,
);

class CommentsNotifier extends AsyncNotifier<List<Comment>> {
  CommentsNotifier(this.postId);
  final String postId;

  @override
  Future<List<Comment>> build() => ref.watch(postRepositoryProvider).comments(postId);

  /// Posts a comment as the signed-in user. Throws [ApiException] on failure.
  Future<void> add(String text) async {
    final user = ref.read(authRepositoryProvider).currentUser;
    if (user == null) return;
    final created = await ref.read(postRepositoryProvider).addComment(postId, text, user);
    state = AsyncData([created, ...state.value ?? const []]);
  }
}

/// Whether the viewer follows a user (false for guests).
final followProvider = AsyncNotifierProvider.autoDispose.family<FollowNotifier, bool, String>(
  FollowNotifier.new,
);

class FollowNotifier extends AsyncNotifier<bool> {
  FollowNotifier(this.userId);
  final String userId;

  @override
  Future<bool> build() async {
    final me = ref.watch(viewerIdProvider);
    if (me == null || me == userId) return false;
    return ref.watch(postRepositoryProvider).isFollowing(me: me, them: userId);
  }

  /// Flips follow/unfollow at once and puts it back if the server refuses.
  /// Throws [ApiException] so the caller can tell the user.
  Future<void> toggle() async {
    final was = state.value ?? false;
    state = AsyncData(!was);
    try {
      await ref.read(postRepositoryProvider).setFollowing(userId, following: !was);
    } on ApiException {
      state = AsyncData(was);
      rethrow;
    }
  }
}
