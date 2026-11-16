import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';

part 'post.freezed.dart';
part 'post.g.dart';

/// A row of the `posts` table. Search results carry only some of the fields,
/// so everything except [id] has a default.
@freezed
abstract class Post with _$Post {
  const Post._();

  const factory Post({
    required String id,
    @Default('') String userId,
    @Default('') String authorName,
    @Default('') String authorUsername,
    String? authorAvatar,
    @Default('Untitled') String title,
    String? description,
    @Default('') String imageUrl,
    String? category,
    @Default(<String>[]) List<String> tags,
    String? medium,
    String? style,
    String? location,
    @Default(true) bool allowComments,
    @Default(0) int likesCount,
    @Default(0) int commentsCount,
    @Default(0) int savesCount,
    DateTime? createdAt,
    @Default(<String>[]) List<String> galleryUrls,
  }) = _Post;

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);

  /// Gallery (for-sale) posts are stored with a `gallery:` category prefix.
  bool get isForSale => (category ?? '').startsWith('gallery:');

  /// Category without the internal `gallery:` prefix.
  String? get displayCategory {
    final c = (category ?? '').replaceFirst(RegExp(r'^gallery:'), '');
    return c.isEmpty ? null : c;
  }

  /// For-sale posts keep price and size inside `description` as JSON:
  /// `{"_price":"₹12000","_dimensions":"24x36 in","_desc":"…"}`.
  Map<String, dynamic>? get _meta {
    final d = description;
    if (d == null || !d.trimLeft().startsWith('{')) return null;
    try {
      final v = jsonDecode(d);
      return v is Map<String, dynamic> && (v.containsKey('_price') || v.containsKey('_desc')) ? v : null;
    } on FormatException {
      return null;
    }
  }

  String? get price => _meta?['_price'] as String?;
  String? get dimensions => _meta?['_dimensions'] as String?;

  /// The human-written description (without the embedded price data).
  String? get descriptionText {
    final meta = _meta;
    final text = meta == null ? description : meta['_desc'] as String?;
    return (text ?? '').trim().isEmpty ? null : text!.trim();
  }

  /// All images: the cover first, then any extra gallery images.
  List<String> get images => [if (imageUrl.isNotEmpty) imageUrl, ...galleryUrls.where((u) => u != imageUrl)];
}
