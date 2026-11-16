import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_user.dart';
import '../models/comment.dart';
import '../models/post.dart';
import '../models/profile.dart';
import '../models/reaction.dart';

final postRepositoryProvider = Provider<PostRepository>((ref) => PostRepository(ref.watch(dioProvider)));

typedef PostPage = ({List<Post> posts, bool hasMore});
typedef PostDetail = ({Post post, bool saved, ReactionState reactions});
typedef SearchResults = ({List<Post> posts, List<Profile> accounts});

/// Posts, reactions, saves, comments, follows and search (`/api/posts`,
/// `/api/comments`, `/api/follows`, `/api/search`). The server takes the acting
/// user from the login token, so no user id is sent for "me".
class PostRepository {
  PostRepository(this._dio);
  final Dio _dio;

  static List<Post> _posts(Object? json) => [
    for (final p in (json as List<dynamic>? ?? const [])) Post.fromJson(p as Map<String, dynamic>),
  ];

  static Map<String, int> _counts(Object? json) => {
    for (final e in (json as Map<String, dynamic>? ?? const {}).entries)
      if (e.value is num) e.key: (e.value as num).toInt(),
  };

  /// Newest first. [category] / [userId] narrow the list.
  Future<PostPage> list({int limit = 24, int offset = 0, String? category, String? userId}) =>
      guard(() async {
        final res = await _dio.get<Map<String, dynamic>>(
          '/posts',
          queryParameters: {'limit': limit, 'offset': offset, 'category': ?category, 'userId': ?userId},
        );
        return (posts: _posts(res.data?['posts']), hasMore: res.data?['hasMore'] == true);
      });

  /// One post plus what the signed-in viewer did with it.
  Future<PostDetail> detail(String id) => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>('/posts/$id');
    final data = res.data!;
    final post = Post.fromJson(data['post'] as Map<String, dynamic>);
    final liked = data['liked'] == true;
    return (
      post: post,
      saved: data['saved'] == true,
      reactions: ReactionState(
        mine: data['reaction'] as String? ?? (liked ? Reaction.like.key : null),
        count: post.likesCount,
        counts: _counts(data['reactions']),
      ),
    );
  });

  /// Sets my reaction ([reaction] = null removes it). Returns the server's totals.
  Future<ReactionState> react(String postId, String? reaction) => guard(() async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/posts/$postId',
      data: reaction == null ? {'action': 'unlike'} : {'action': 'like', 'reaction': reaction},
    );
    final data = res.data ?? const {};
    return ReactionState(
      mine: data['reaction'] as String?,
      count: (data['likes_count'] as num?)?.toInt() ?? 0,
      counts: _counts(data['reactions']),
    );
  });

  Future<void> setSaved(String postId, {required bool saved}) =>
      guard(() => _dio.post<void>('/posts/$postId', data: {'action': saved ? 'save' : 'unsave'}));

  /// Newest first.
  Future<List<Comment>> comments(String postId) => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>('/comments', queryParameters: {'postId': postId});
    return [
      for (final c in (res.data?['comments'] as List<dynamic>? ?? const []))
        Comment.fromJson(c as Map<String, dynamic>),
    ];
  });

  Future<Comment> addComment(String postId, String text, AuthUser author) => guard(() async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/comments',
      data: {
        'user_id': author.id,
        'author_name': author.name,
        'author_avatar': author.imageUrl,
        'post_id': postId,
        'text': text,
      },
    );
    return Comment.fromJson(res.data!['comment'] as Map<String, dynamic>);
  });

  Future<bool> isFollowing({required String me, required String them}) => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/follows',
      queryParameters: {'followerId': me, 'followingId': them},
    );
    return res.data?['following'] == true;
  });

  Future<void> setFollowing(String userId, {required bool following}) => guard(
    () => following
        ? _dio.post<void>('/follows', data: {'followingId': userId})
        : _dio.delete<void>('/follows', data: {'followingId': userId}),
  );

  Future<SearchResults> search(String query) => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>('/search', queryParameters: {'q': query, 'type': 'all'});
    return (
      posts: _posts(res.data?['posts']),
      accounts: [
        for (final a in (res.data?['accounts'] as List<dynamic>? ?? const []))
          Profile.fromJson(a as Map<String, dynamic>),
      ],
    );
  });
}
