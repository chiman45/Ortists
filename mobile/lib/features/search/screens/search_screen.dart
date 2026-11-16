import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/theme/tokens.dart';
import '../../../data/models/profile.dart';
import '../../../data/repositories/post_repository.dart';
import '../../feed/screens/feed_screen.dart';
import '../../feed/screens/post_detail_screen.dart';
import '../../feed/widgets/post_card.dart';

/// Results for one query. Kept while the screen is open so going back from a
/// post doesn't search again.
final searchProvider = FutureProvider.autoDispose.family<SearchResults, String>(
  (ref, query) => ref.watch(postRepositoryProvider).search(query),
);

/// The server only accepts these characters (see `/api/search`).
final _allowed = RegExp(r'^[\w\s\-_.@#]{1,100}$');

/// Search artworks (title, category) and artists (name, username, tag).
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _input = TextEditingController();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _input.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    // Wait until typing pauses, like the website
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) setState(() => _query = value.trim());
    });
    setState(() {}); // show/hide the clear button
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          key: const Key('search-input'),
          controller: _input,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onChanged: _onChanged,
          decoration: InputDecoration(
            hintText: 'Search artworks and artists',
            prefixIcon: const Icon(Icons.search_rounded, size: 20),
            suffixIcon: _input.text.isEmpty
                ? null
                : IconButton(
                    tooltip: 'Clear',
                    icon: const Icon(Icons.close_rounded, size: 18),
                    onPressed: () {
                      _input.clear();
                      _onChanged('');
                    },
                  ),
            isDense: true,
          ),
        ),
        actions: const [SizedBox(width: Insets.md)],
      ),
      body: _results(c),
    );
  }

  Widget _results(OrtistsColors c) {
    Widget hint(String text) => Center(
      child: Padding(
        padding: const EdgeInsets.all(Insets.xl),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(color: c.text4),
        ),
      ),
    );

    if (_query.isEmpty) return hint('Find artwork by title or style, or look up an artist.');
    if (!_allowed.hasMatch(_query)) return hint('Use letters and numbers only.');

    return ref
        .watch(searchProvider(_query))
        .when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => hint(e is ApiException ? e.message : 'Search failed. Please try again.'),
          data: (r) {
            if (r.posts.isEmpty && r.accounts.isEmpty) return hint('Nothing found for "$_query".');
            return CustomScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              slivers: [
                if (r.accounts.isNotEmpty) ...[
                  const SliverToBoxAdapter(child: _Heading('Artists')),
                  SliverList.builder(
                    itemCount: r.accounts.length,
                    itemBuilder: (_, i) => _AccountTile(r.accounts[i]),
                  ),
                ],
                if (r.posts.isNotEmpty) ...[
                  const SliverToBoxAdapter(child: _Heading('Artwork')),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: Insets.md),
                    sliver: PostGrid(posts: r.posts),
                  ),
                ],
                const SliverToBoxAdapter(child: SizedBox(height: Insets.xl)),
              ],
            );
          },
        );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(Insets.lg, Insets.lg, Insets.lg, Insets.sm),
    child: Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
  );
}

class _AccountTile extends StatelessWidget {
  const _AccountTile(this.profile);
  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final handle = (profile.username ?? '').replaceFirst('@', '');
    final sub = [if (handle.isNotEmpty) '@$handle', profile.tag, profile.location].nonNulls.join(' · ');
    return ListTile(
      leading: Avatar(url: profile.avatarUrl, size: 40),
      title: Text(
        profile.displayName ?? handle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: sub.isEmpty
          ? null
          : Text(
              sub,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: c.text4, fontSize: 12),
            ),
      trailing: FollowChip(userId: profile.clerkId),
    );
  }
}
