// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Profile _$ProfileFromJson(Map<String, dynamic> json) => _Profile(
  clerkId: json['clerk_id'] as String,
  username: json['username'] as String?,
  displayName: json['display_name'] as String?,
  bio: json['bio'] as String?,
  avatarUrl: json['avatar_url'] as String?,
  bannerUrl: json['banner_url'] as String?,
  location: json['location'] as String?,
  tag: json['tag'] as String?,
  available: json['available'] as bool? ?? true,
  responseTime: json['response_time'] as String?,
  followersCount: (json['followers_count'] as num?)?.toInt() ?? 0,
  followingCount: (json['following_count'] as num?)?.toInt() ?? 0,
  phone: json['phone'] as String?,
  role: json['role'] as String?,
  agreementVersion: json['agreement_version'] as String?,
);

Map<String, dynamic> _$ProfileToJson(_Profile instance) => <String, dynamic>{
  'clerk_id': instance.clerkId,
  'username': instance.username,
  'display_name': instance.displayName,
  'bio': instance.bio,
  'avatar_url': instance.avatarUrl,
  'banner_url': instance.bannerUrl,
  'location': instance.location,
  'tag': instance.tag,
  'available': instance.available,
  'response_time': instance.responseTime,
  'followers_count': instance.followersCount,
  'following_count': instance.followingCount,
  'phone': instance.phone,
  'role': instance.role,
  'agreement_version': instance.agreementVersion,
};
