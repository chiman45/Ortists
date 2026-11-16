import 'package:freezed_annotation/freezed_annotation.dart';

part 'comment.freezed.dart';
part 'comment.g.dart';

/// A row of the `comments` table.
@freezed
abstract class Comment with _$Comment {
  const factory Comment({
    required String id,
    @Default('') String userId,
    @Default('Someone') String authorName,
    String? authorAvatar,
    required String postId,
    required String text,
    DateTime? createdAt,
  }) = _Comment;

  factory Comment.fromJson(Map<String, dynamic> json) => _$CommentFromJson(json);
}
