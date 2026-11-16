import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ortists/app/app.dart';
import 'package:ortists/core/auth/session.dart';
import 'package:ortists/core/theme/widgets.dart';
import 'package:ortists/data/models/post.dart';
import 'package:ortists/data/models/profile.dart';
import 'package:ortists/data/models/reaction.dart';
import 'package:ortists/data/repositories/post_repository.dart';
import 'package:ortists/data/repositories/profile_repository.dart';
import 'package:ortists/features/feed/providers/feed_providers.dart';
import 'package:ortists/features/feed/screens/post_detail_screen.dart';
import 'package:ortists/features/feed/widgets/post_card.dart';

import '../helpers/fakes.dart';

const _ready = Profile(clerkId: 'user_1', agreementVersion: 'v2', phone: '9876543210');

void main() {
  group('Post', () {
    test('for-sale posts keep price and size inside the description', () {
      final p = Post.fromJson({
        'id': 'p1',
        'category': 'gallery:Portrait',
        'description': '{"_price":"₹12000","_dimensions":"24x36 in","_desc":"Oil on canvas"}',
        'image_url': 'a.jpg',
        'gallery_urls': ['a.jpg', 'b.jpg'],
        'likes_count': 4,
        'created_at': '2026-11-15T16:19:03.528369+00:00',
      });
      expect(p.isForSale, isTrue);
      expect(p.displayCategory, 'Portrait');
      expect(p.price, '₹12000');
      expect(p.dimensions, '24x36 in');
      expect(p.descriptionText, 'Oil on canvas');
      expect(p.images, ['a.jpg', 'b.jpg']);
      expect(p.createdAt!.year, 2026);
    });

    test('normal posts show their description as written', () {
      const p = Post(id: 'p1', category: 'Sketch', description: 'Just {a} sketch');
      expect(p.isForSale, isFalse);
      expect(p.price, isNull);
      expect(p.descriptionText, 'Just {a} sketch');
      expect(const Post(id: 'p2', description: '  ').descriptionText, isNull);
    });
  });

  group('reactions', () {
    test('switching reaction keeps the total; removing lowers it', () {
      const s = ReactionState(mine: 'like', count: 5, counts: {'like': 4, 'fire': 1});
      final switched = s.optimistic('funny');
      expect(switched.count, 5);
      expect(switched.counts, {'like': 3, 'fire': 1, 'funny': 1});
      expect(s.optimistic(null).count, 4);
      expect(const ReactionState().optimistic('like').count, 1);
    });

    test('top reactions are the most used, biggest first', () {
      expect(Reaction.top({'like': 2, 'wow': 5, 'clap': 0}).map((r) => r.key), ['wow', 'like']);
      expect(Reaction.of('unknown')!.key, 'like');
      expect(Reaction.of(null), isNull);
    });
  });

  test('compactCount', () {
    expect([0, 950, 1200, 1000, 34500, 1500000].map(compactCount), ['0', '950', '1.2k', '1k', '34k', '1.5M']);
  });

  group('feed paging', () {
    test('loads the next page and drops repeats', () async {
      final repo = FakePostRepository(posts: [for (var i = 1; i <= 30; i++) testPost(i)]);
      final c = ProviderContainer(overrides: [postRepositoryProvider.overrideWithValue(repo)]);
      addTearDown(c.dispose);

      expect((await c.read(feedProvider.future)).posts, hasLength(24));
      // Someone publishes while we scroll: page 2 now starts with a post we already have
      repo.posts.insert(0, testPost(99));
      await c.read(feedProvider.notifier).loadMore();

      final state = c.read(feedProvider).value!;
      expect(state.posts.map((p) => p.id).toSet(), hasLength(state.posts.length));
      expect(state.posts, hasLength(30));
      expect(state.hasMore, isFalse);
    });

    test('a failed next page keeps what is shown and can be retried', () async {
      final repo = FakePostRepository(posts: [for (var i = 1; i <= 30; i++) testPost(i)]);
      final c = ProviderContainer(overrides: [postRepositoryProvider.overrideWithValue(repo)]);
      addTearDown(c.dispose);
      await c.read(feedProvider.future);

      repo.error = 'Server down';
      await c.read(feedProvider.notifier).loadMore();
      expect(c.read(feedProvider).value!.posts, hasLength(24));
      expect(c.read(feedProvider).value!.loadMoreError, 'Server down');

      repo.error = null;
      await c.read(feedProvider.notifier).loadMore();
      expect(c.read(feedProvider).value!.posts, hasLength(30));
    });
  });

  group('screens', () {
    late FakeAuthRepository auth;
    late FakePostRepository posts;

    Future<void> pumpApp(WidgetTester tester, {bool signedIn = false, List<Post>? list}) async {
      auth = FakeAuthRepository(user: signedIn ? testUser : null);
      posts = FakePostRepository(posts: list);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(auth),
            profileRepositoryProvider.overrideWithValue(FakeProfileRepository(profile: _ready)),
            postRepositoryProvider.overrideWithValue(posts),
          ],
          child: const OrtistsApp(googleFonts: false),
        ),
      );
      await tester.pumpAndSettle();
    }

    Future<void> openPost(WidgetTester tester, String title) async {
      await tester.tap(find.bySemanticsLabel(RegExp('^$title by ')));
      await tester.pumpAndSettle();
      expect(find.byType(PostDetailScreen), findsOneWidget);
    }

    String count(WidgetTester tester) => tester.widget<Text>(find.byKey(const Key('reaction-count'))).data!;

    List<String> cardOrder(WidgetTester tester) =>
        tester.widgetList<PostCard>(find.byType(PostCard)).map((c) => c.post.id).toList();

    testWidgets('Latest keeps server order, Popular puts the most liked first', (tester) async {
      await pumpApp(tester); // p1 (1 like), p2 (2), p3 (3), newest first
      expect(cardOrder(tester), ['p1', 'p2', 'p3']);

      await tester.tap(find.byKey(const Key('tab-Popular')));
      await tester.pumpAndSettle();
      expect(cardOrder(tester), ['p3', 'p2', 'p1']);
    });

    testWidgets('shows a retry when the feed cannot load', (tester) async {
      auth = FakeAuthRepository();
      posts = FakePostRepository()..error = 'No internet connection.';
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(auth),
            postRepositoryProvider.overrideWithValue(posts),
          ],
          child: const OrtistsApp(googleFonts: false),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('No internet connection.'), findsOneWidget);

      posts.error = null;
      await tester.tap(find.text('Try again'));
      await tester.pumpAndSettle();
      expect(find.byType(PostCard), findsNWidgets(3));
    });

    testWidgets('guests can read a post but reacting asks them to log in', (tester) async {
      await pumpApp(tester);
      await openPost(tester, 'Artwork 2');
      expect(find.text('Artwork 2'), findsOneWidget);
      expect(count(tester), '2');

      await tester.tap(find.byKey(const Key('reaction-button')));
      await tester.pumpAndSettle();
      expect(find.text('Join Ortists'), findsOneWidget);
      expect(posts.calls.where((c) => c.startsWith('react')), isEmpty);
      expect(count(tester), '2');
    });

    testWidgets('tap loves and un-loves; hold to pick another reaction', (tester) async {
      await pumpApp(tester, signedIn: true);
      await openPost(tester, 'Artwork 2');

      await tester.tap(find.byKey(const Key('reaction-button')));
      await tester.pumpAndSettle();
      expect(count(tester), '3');
      expect(posts.myReactions['p2'], 'like');

      await tester.longPress(find.byKey(const Key('reaction-button')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('reaction-picker')), findsOneWidget);
      await tester.tap(find.byKey(const Key('react-funny')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('reaction-picker')), findsNothing);
      expect(posts.myReactions['p2'], 'funny');
      expect(count(tester), '3'); // switching doesn't change the total

      await tester.tap(find.byKey(const Key('reaction-button')));
      await tester.pumpAndSettle();
      expect(count(tester), '2');
      expect(posts.myReactions.containsKey('p2'), isFalse);
    });

    testWidgets('a reaction that fails to save is put back and explained', (tester) async {
      await pumpApp(tester, signedIn: true);
      await openPost(tester, 'Artwork 2');

      posts.error = 'Could not save your reaction.';
      await tester.tap(find.byKey(const Key('reaction-button')));
      await tester.pumpAndSettle();
      expect(count(tester), '2');
      expect(find.text('Could not save your reaction.'), findsOneWidget);
    });

    testWidgets('save, follow and comment work for signed-in users', (tester) async {
      await pumpApp(tester, signedIn: true);
      await openPost(tester, 'Artwork 1');

      await tester.tap(find.byKey(const Key('save-button')));
      await tester.pumpAndSettle();
      expect(posts.saved, {'p1'});

      expect(tester.widget<FollowButton>(find.byKey(const Key('follow-button'))).following, isFalse);
      await tester.tap(find.byKey(const Key('follow-button')));
      await tester.pumpAndSettle();
      expect(posts.following, {'artist_1'});
      expect(find.text('Following'), findsOneWidget);

      expect(find.text('Comments (0)'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('comment-input')), 'Beautiful colours!');
      await tester.pump();
      await tester.tap(find.byKey(const Key('comment-send')));
      await tester.pumpAndSettle();
      expect(find.text('Beautiful colours!'), findsOneWidget);
      expect(find.text('Comments (1)'), findsOneWidget);
      expect(find.text('Asha Rao'), findsOneWidget);
    });

    testWidgets('no Follow button on your own post; price shows on for-sale posts', (tester) async {
      await pumpApp(
        tester,
        signedIn: true,
        list: [
          testPost(
            1,
            userId: 'user_1',
            category: 'gallery:Portrait',
            description: '{"_price":"₹12000","_desc":"Oil"}',
          ),
        ],
      );
      await openPost(tester, 'Artwork 1');
      expect(find.byKey(const Key('follow-button')), findsNothing);
      expect(find.text('₹12000'), findsWidgets);
      expect(find.text('Oil'), findsOneWidget);
    });

    testWidgets('search finds artists and artwork after typing pauses', (tester) async {
      await pumpApp(tester);
      posts.searchResults = (
        posts: [testPost(7)],
        accounts: [
          const Profile(clerkId: 'artist_9', displayName: 'Tribhuvan Kumar', username: 'tribhuvanku'),
        ],
      );
      await tester.tap(find.byKey(const Key('open-search')));
      await tester.pumpAndSettle();

      await tester.enterText(find.byKey(const Key('search-input')), 'trib');
      await tester.pump(const Duration(milliseconds: 100));
      expect(posts.calls.where((c) => c.startsWith('search')), isEmpty); // still typing
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pumpAndSettle();

      expect(posts.calls, contains('search trib'));
      expect(find.text('Tribhuvan Kumar'), findsOneWidget);
      expect(find.text('@tribhuvanku'), findsOneWidget);
      expect(find.byType(PostCard), findsOneWidget);
    });
  });
}
