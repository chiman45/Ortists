// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Post _$PostFromJson(Map<String, dynamic> json) => _Post(
  id: json['id'] as String,
  userId: json['user_id'] as String? ?? '',
  authorName: json['author_name'] as String? ?? '',
  authorUsername: json['author_username'] as String? ?? '',
  authorAvatar: json['author_avatar'] as String?,
  title: json['title'] as String? ?? 'Untitled',
  description: json['description'] as String?,
  imageUrl: json['image_url'] as String? ?? '',
  category: json['category'] as String?,
  tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const <String>[],
  medium: json['medium'] as String?,
  style: json['style'] as String?,
  location: json['location'] as String?,
  allowComments: json['allow_comments'] as bool? ?? true,
  likesCount: (json['likes_count'] as num?)?.toInt() ?? 0,
  commentsCount: (json['comments_count'] as num?)?.toInt() ?? 0,
  savesCount: (json['saves_count'] as num?)?.toInt() ?? 0,
  createdAt: json['created_at'] == null ? null : DateTime.parse(json['created_at'] as String),
  galleryUrls: (json['gallery_urls'] as List<dynamic>?)?.map((e) => e as String).toList() ?? const <String>[],
);

Map<String, dynamic> _$PostToJson(_Post instance) => <String, dynamic>{
  'id': instance.id,
  'user_id': instance.userId,
  'author_name': instance.authorName,
  'author_username': instance.authorUsername,
  'author_avatar': instance.authorAvatar,
  'title': instance.title,
  'description': instance.description,
  'image_url': instance.imageUrl,
  'category': instance.category,
  'tags': instance.tags,
  'medium': instance.medium,
  'style': instance.style,
  'location': instance.location,
  'allow_comments': instance.allowComments,
  'likes_count': instance.likesCount,
  'comments_count': instance.commentsCount,
  'saves_count': instance.savesCount,
  'created_at': instance.createdAt?.toIso8601String(),
  'gallery_urls': instance.galleryUrls,
};
