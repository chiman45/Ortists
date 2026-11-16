// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'comment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Comment _$CommentFromJson(Map<String, dynamic> json) => _Comment(
  id: json['id'] as String,
  userId: json['user_id'] as String? ?? '',
  authorName: json['author_name'] as String? ?? 'Someone',
  authorAvatar: json['author_avatar'] as String?,
  postId: json['post_id'] as String,
  text: json['text'] as String,
  createdAt: json['created_at'] == null ? null : DateTime.parse(json['created_at'] as String),
);

Map<String, dynamic> _$CommentToJson(_Comment instance) => <String, dynamic>{
  'id': instance.id,
  'user_id': instance.userId,
  'author_name': instance.authorName,
  'author_avatar': instance.authorAvatar,
  'post_id': instance.postId,
  'text': instance.text,
  'created_at': instance.createdAt?.toIso8601String(),
};
