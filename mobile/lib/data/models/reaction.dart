import 'package:flutter/painting.dart';

/// LinkedIn-style reactions — same list, order and colours as the website
/// (`src/lib/reactions.ts`). "like" (❤️) is the default for a quick tap.
class Reaction {
  const Reaction(this.key, this.emoji, this.label, this.color);

  final String key;
  final String emoji;
  final String label;
  final Color color;

  static const like = Reaction('like', '❤️', 'Love', Color(0xFFF43F5E));

  static const all = [
    like,
    Reaction('fire', '🔥', 'Fire', Color(0xFFF97316)),
    Reaction('funny', '😂', 'Funny', Color(0xFFF59E0B)),
    Reaction('wow', '😮', 'Wow', Color(0xFFEAB308)),
    Reaction('clap', '👏', 'Applause', Color(0xFF10B981)),
    Reaction('inspire', '🎨', 'Inspiring', Color(0xFF9B7CF5)),
  ];

  /// Unknown keys count as a plain like, as on the server.
  static Reaction? of(String? key) =>
      key == null ? null : all.firstWhere((r) => r.key == key, orElse: () => like);

  /// The most-used reactions on a post, biggest first (the little emoji stack).
  static List<Reaction> top(Map<String, int> counts, [int n = 3]) {
    final used = all.where((r) => (counts[r.key] ?? 0) > 0).toList()
      ..sort((a, b) => counts[b.key]!.compareTo(counts[a.key]!));
    return used.take(n).toList();
  }
}

/// What a post's reaction button shows: my reaction, the total, and the split.
class ReactionState {
  const ReactionState({this.mine, this.count = 0, this.counts = const {}});

  final String? mine;
  final int count;
  final Map<String, int> counts;

  /// The state right after the user picks [next] (null = remove), before the server answers.
  ReactionState optimistic(String? next) {
    final c = Map<String, int>.of(counts);
    final prev = mine;
    if (prev != null) c[prev] = ((c[prev] ?? 1) - 1).clamp(0, 1 << 31);
    if (next != null) c[next] = (c[next] ?? 0) + 1;
    return ReactionState(
      mine: next,
      count: count + (next != null ? 1 : 0) - (prev != null ? 1 : 0),
      counts: c,
    );
  }
}
