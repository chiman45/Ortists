import 'dart:async';

import 'package:ortists/core/api/api_exception.dart';
import 'package:ortists/core/auth/auth_repository.dart';
import 'package:ortists/core/auth/auth_user.dart';
import 'package:ortists/data/models/agreements_info.dart';
import 'package:ortists/data/models/comment.dart';
import 'package:ortists/data/models/post.dart';
import 'package:ortists/data/models/profile.dart';
import 'package:ortists/data/models/reaction.dart';
import 'package:ortists/data/repositories/post_repository.dart';
import 'package:ortists/data/repositories/profile_repository.dart';

const testUser = AuthUser(id: 'user_1', name: 'Asha Rao', email: 'asha@example.com');

const testAgreements = AgreementsInfo(
  version: 'v2',
  required: {
    'artist': [
      AgreementDoc(key: 'artistAgreement', title: 'Artist Agreement', path: '/artists-agreement'),
      AgreementDoc(key: 'platformTerms', title: 'Platform Terms', path: '/terms'),
    ],
    'client': [AgreementDoc(key: 'clientTerms', title: 'Client Terms', path: '/client-agreement')],
  },
);

/// In-memory login. Set the `…Error` fields to make a call fail.
class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({AuthUser? user}) : _user = user; // ignore: prefer_initializing_formals

  AuthUser? _user;
  final _changes = StreamController<AuthUser?>.broadcast();
  final calls = <String>[];

  String? signInError;
  SignInResult signInResult = SignInResult.signedIn;
  String? signUpError;
  String? codeError;

  void _set(AuthUser? user) {
    _user = user;
    _changes.add(user);
  }

  @override
  AuthUser? get currentUser => _user;
  @override
  Stream<AuthUser?> get userChanges => _changes.stream;
  @override
  Future<void> init() async {}

  @override
  Future<void> signUp({required String email, required String password, required String phone}) async {
    calls.add('signUp $email $phone');
    if (signUpError != null) throw AuthException(signUpError!);
  }

  @override
  Future<void> verifyEmailCode(String code) async {
    calls.add('verifyEmailCode $code');
    if (codeError != null) throw AuthException(codeError!);
    _set(testUser);
  }

  @override
  Future<SignInResult> signIn({required String email, required String password}) async {
    calls.add('signIn $email');
    if (signInError != null) throw AuthException(signInError!);
    if (signInResult == SignInResult.signedIn) _set(testUser);
    return signInResult;
  }

  @override
  Future<void> verifySignInCode(String code) async {
    calls.add('verifySignInCode $code');
    if (codeError != null) throw AuthException(codeError!);
    _set(testUser);
  }

  @override
  Future<String?> sessionToken() async => _user == null ? null : 'token';

  @override
  Future<void> signOut() async {
    calls.add('signOut');
    _set(null);
  }

  @override
  void dispose() => unawaited(_changes.close());
}

/// In-memory profile API holding one profile for [testUser].
class FakeProfileRepository implements ProfileRepository {
  FakeProfileRepository({Profile? profile}) : profile = profile ?? const Profile(clerkId: 'user_1');

  Profile profile;
  final takenPhones = <String>{};
  final calls = <String>[];
  String? updateError;

  @override
  Future<Profile?> fetch(String idOrUsername) async => profile;

  @override
  Future<Profile> sync(AuthUser user, {String? phone}) async {
    calls.add('sync ${user.id} ${phone ?? '-'}');
    if (phone != null && (profile.phone ?? '').isEmpty) profile = profile.copyWith(phone: phone);
    return profile;
  }

  @override
  Future<Profile> update(Map<String, Object?> fields) async {
    calls.add('update ${fields.keys.join(',')}');
    if (updateError != null) throw ApiException(updateError!, statusCode: 409);
    profile = profile.copyWith(
      phone: fields['phone'] as String? ?? profile.phone,
      role: fields['role'] as String? ?? profile.role,
      agreementVersion: fields['agreement_version'] as String? ?? profile.agreementVersion,
    );
    return profile;
  }

  @override
  Future<bool> phoneAvailable(String phone) async => !takenPhones.contains(phone);

  @override
  Future<AgreementsInfo> agreements() async => testAgreements;
}

/// Posts without image URLs, so widget tests never touch the network.
Post testPost(int n, {int likes = 0, String userId = 'artist_1', String? category, String? description}) =>
    Post(
      id: 'p$n',
      userId: userId,
      authorName: 'Artist $n',
      authorUsername: 'artist$n',
      title: 'Artwork $n',
      likesCount: likes,
      category: category,
      description: description,
    );

/// In-memory posts API. Set [error] to make every call fail.
class FakePostRepository implements PostRepository {
  FakePostRepository({List<Post>? posts})
    : posts = posts ?? [for (var i = 1; i <= 3; i++) testPost(i, likes: i)];

  List<Post> posts;
  final calls = <String>[];
  String? error;

  /// What the signed-in viewer did, per post / user.
  final myReactions = <String, String>{};
  final saved = <String>{};
  final following = <String>{};
  final commentsByPost = <String, List<Comment>>{};
  SearchResults searchResults = (posts: const [], accounts: const []);

  void _check() {
    if (error != null) throw ApiException(error!, statusCode: 500);
  }

  ReactionState _reactions(Post p) {
    final mine = myReactions[p.id];
    return ReactionState(
      mine: mine,
      count: p.likesCount,
      counts: {
        'like': p.likesCount - (mine == null || mine == 'like' ? 0 : 1),
        if (mine != null && mine != 'like') mine: 1,
      },
    );
  }

  @override
  Future<PostPage> list({int limit = 24, int offset = 0, String? category, String? userId}) async {
    calls.add('list offset=$offset${category == null ? '' : ' category=$category'}');
    _check();
    final all = posts.where((p) => category == null || p.category == category).toList();
    final page = all.skip(offset).take(limit).toList();
    return (posts: page, hasMore: offset + page.length < all.length);
  }

  @override
  Future<PostDetail> detail(String id) async {
    _check();
    final post = posts.firstWhere(
      (p) => p.id == id,
      orElse: () => throw const ApiException('Not found.', statusCode: 404),
    );
    return (post: post, saved: saved.contains(id), reactions: _reactions(post));
  }

  @override
  Future<ReactionState> react(String postId, String? reaction) async {
    calls.add('react $postId ${reaction ?? 'none'}');
    _check();
    final i = posts.indexWhere((p) => p.id == postId);
    final had = myReactions.containsKey(postId);
    reaction == null ? myReactions.remove(postId) : myReactions[postId] = reaction;
    posts[i] = posts[i].copyWith(
      likesCount: posts[i].likesCount + (reaction != null ? 1 : 0) - (had ? 1 : 0),
    );
    return _reactions(posts[i]);
  }

  @override
  Future<void> setSaved(String postId, {required bool saved}) async {
    calls.add('save $postId $saved');
    _check();
    saved ? this.saved.add(postId) : this.saved.remove(postId);
  }

  @override
  Future<List<Comment>> comments(String postId) async => commentsByPost[postId] ?? const [];

  @override
  Future<Comment> addComment(String postId, String text, AuthUser author) async {
    calls.add('comment $postId $text');
    _check();
    final c = Comment(
      id: 'c${calls.length}',
      postId: postId,
      text: text,
      authorName: author.name,
      userId: author.id,
    );
    commentsByPost[postId] = [c, ...commentsByPost[postId] ?? const []];
    return c;
  }

  @override
  Future<bool> isFollowing({required String me, required String them}) async => following.contains(them);

  @override
  Future<void> setFollowing(String userId, {required bool following}) async {
    calls.add('follow $userId $following');
    _check();
    following ? this.following.add(userId) : this.following.remove(userId);
  }

  @override
  Future<SearchResults> search(String query) async {
    calls.add('search $query');
    _check();
    return searchResults;
  }
}
