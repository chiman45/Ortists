// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'profile.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Profile {

 String get clerkId; String? get username; String? get displayName; String? get bio; String? get avatarUrl; String? get bannerUrl; String? get location; String? get tag; bool get available; String? get responseTime; int get followersCount; int get followingCount; String? get phone;/// "artist" or "client", chosen on the agreements step.
 String? get role; String? get agreementVersion;
/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProfileCopyWith<Profile> get copyWith => _$ProfileCopyWithImpl<Profile>(this as Profile, _$identity);

  /// Serializes this Profile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Profile;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Profile&&(identical(other.clerkId, _this.clerkId) || other.clerkId == _this.clerkId)&&(identical(other.username, _this.username) || other.username == _this.username)&&(identical(other.displayName, _this.displayName) || other.displayName == _this.displayName)&&(identical(other.bio, _this.bio) || other.bio == _this.bio)&&(identical(other.avatarUrl, _this.avatarUrl) || other.avatarUrl == _this.avatarUrl)&&(identical(other.bannerUrl, _this.bannerUrl) || other.bannerUrl == _this.bannerUrl)&&(identical(other.location, _this.location) || other.location == _this.location)&&(identical(other.tag, _this.tag) || other.tag == _this.tag)&&(identical(other.available, _this.available) || other.available == _this.available)&&(identical(other.responseTime, _this.responseTime) || other.responseTime == _this.responseTime)&&(identical(other.followersCount, _this.followersCount) || other.followersCount == _this.followersCount)&&(identical(other.followingCount, _this.followingCount) || other.followingCount == _this.followingCount)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.role, _this.role) || other.role == _this.role)&&(identical(other.agreementVersion, _this.agreementVersion) || other.agreementVersion == _this.agreementVersion));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Profile;
  return Object.hash(runtimeType,_this.clerkId,_this.username,_this.displayName,_this.bio,_this.avatarUrl,_this.bannerUrl,_this.location,_this.tag,_this.available,_this.responseTime,_this.followersCount,_this.followingCount,_this.phone,_this.role,_this.agreementVersion);
}

@override
String toString() {
  final _this = this as Profile;
  return 'Profile(clerkId: ${_this.clerkId}, username: ${_this.username}, displayName: ${_this.displayName}, bio: ${_this.bio}, avatarUrl: ${_this.avatarUrl}, bannerUrl: ${_this.bannerUrl}, location: ${_this.location}, tag: ${_this.tag}, available: ${_this.available}, responseTime: ${_this.responseTime}, followersCount: ${_this.followersCount}, followingCount: ${_this.followingCount}, phone: ${_this.phone}, role: ${_this.role}, agreementVersion: ${_this.agreementVersion})';
}


}

/// @nodoc
abstract mixin class $ProfileCopyWith<$Res>  {
  factory $ProfileCopyWith(Profile value, $Res Function(Profile) _then) = _$ProfileCopyWithImpl;
@useResult
$Res call({
 String clerkId, String? username, String? displayName, String? bio, String? avatarUrl, String? bannerUrl, String? location, String? tag, bool available, String? responseTime, int followersCount, int followingCount, String? phone, String? role, String? agreementVersion
});




}
/// @nodoc
class _$ProfileCopyWithImpl<$Res>
    implements $ProfileCopyWith<$Res> {
  _$ProfileCopyWithImpl(this._self, this._then);

  final Profile _self;
  final $Res Function(Profile) _then;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? clerkId = null,Object? username = freezed,Object? displayName = freezed,Object? bio = freezed,Object? avatarUrl = freezed,Object? bannerUrl = freezed,Object? location = freezed,Object? tag = freezed,Object? available = null,Object? responseTime = freezed,Object? followersCount = null,Object? followingCount = null,Object? phone = freezed,Object? role = freezed,Object? agreementVersion = freezed,}) {
  return _then(Profile(
clerkId: null == clerkId ? _self.clerkId : clerkId // ignore: cast_nullable_to_non_nullable
as String,username: freezed == username ? _self.username : username // ignore: cast_nullable_to_non_nullable
as String?,displayName: freezed == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,bannerUrl: freezed == bannerUrl ? _self.bannerUrl : bannerUrl // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,tag: freezed == tag ? _self.tag : tag // ignore: cast_nullable_to_non_nullable
as String?,available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,responseTime: freezed == responseTime ? _self.responseTime : responseTime // ignore: cast_nullable_to_non_nullable
as String?,followersCount: null == followersCount ? _self.followersCount : followersCount // ignore: cast_nullable_to_non_nullable
as int,followingCount: null == followingCount ? _self.followingCount : followingCount // ignore: cast_nullable_to_non_nullable
as int,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,agreementVersion: freezed == agreementVersion ? _self.agreementVersion : agreementVersion // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Profile].
extension ProfilePatterns on Profile {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Profile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Profile value)  $default,){
final _that = this;
switch (_that) {
case _Profile():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Profile value)?  $default,){
final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String clerkId,  String? username,  String? displayName,  String? bio,  String? avatarUrl,  String? bannerUrl,  String? location,  String? tag,  bool available,  String? responseTime,  int followersCount,  int followingCount,  String? phone,  String? role,  String? agreementVersion)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that.clerkId,_that.username,_that.displayName,_that.bio,_that.avatarUrl,_that.bannerUrl,_that.location,_that.tag,_that.available,_that.responseTime,_that.followersCount,_that.followingCount,_that.phone,_that.role,_that.agreementVersion);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String clerkId,  String? username,  String? displayName,  String? bio,  String? avatarUrl,  String? bannerUrl,  String? location,  String? tag,  bool available,  String? responseTime,  int followersCount,  int followingCount,  String? phone,  String? role,  String? agreementVersion)  $default,) {final _that = this;
switch (_that) {
case _Profile():
return $default(_that.clerkId,_that.username,_that.displayName,_that.bio,_that.avatarUrl,_that.bannerUrl,_that.location,_that.tag,_that.available,_that.responseTime,_that.followersCount,_that.followingCount,_that.phone,_that.role,_that.agreementVersion);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String clerkId,  String? username,  String? displayName,  String? bio,  String? avatarUrl,  String? bannerUrl,  String? location,  String? tag,  bool available,  String? responseTime,  int followersCount,  int followingCount,  String? phone,  String? role,  String? agreementVersion)?  $default,) {final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that.clerkId,_that.username,_that.displayName,_that.bio,_that.avatarUrl,_that.bannerUrl,_that.location,_that.tag,_that.available,_that.responseTime,_that.followersCount,_that.followingCount,_that.phone,_that.role,_that.agreementVersion);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Profile implements Profile {
  const _Profile({required this.clerkId, this.username, this.displayName, this.bio, this.avatarUrl, this.bannerUrl, this.location, this.tag, this.available = true, this.responseTime, this.followersCount = 0, this.followingCount = 0, this.phone, this.role, this.agreementVersion});
  factory _Profile.fromJson(Map<String, dynamic> json) => _$ProfileFromJson(json);

@override final  String clerkId;
@override final  String? username;
@override final  String? displayName;
@override final  String? bio;
@override final  String? avatarUrl;
@override final  String? bannerUrl;
@override final  String? location;
@override final  String? tag;
@override@JsonKey() final  bool available;
@override final  String? responseTime;
@override@JsonKey() final  int followersCount;
@override@JsonKey() final  int followingCount;
@override final  String? phone;
/// "artist" or "client", chosen on the agreements step.
@override final  String? role;
@override final  String? agreementVersion;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProfileCopyWith<_Profile> get copyWith => __$ProfileCopyWithImpl<_Profile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProfileToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Profile&&(identical(other.clerkId, clerkId) || other.clerkId == clerkId)&&(identical(other.username, username) || other.username == username)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.bio, bio) || other.bio == bio)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.bannerUrl, bannerUrl) || other.bannerUrl == bannerUrl)&&(identical(other.location, location) || other.location == location)&&(identical(other.tag, tag) || other.tag == tag)&&(identical(other.available, available) || other.available == available)&&(identical(other.responseTime, responseTime) || other.responseTime == responseTime)&&(identical(other.followersCount, followersCount) || other.followersCount == followersCount)&&(identical(other.followingCount, followingCount) || other.followingCount == followingCount)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.role, role) || other.role == role)&&(identical(other.agreementVersion, agreementVersion) || other.agreementVersion == agreementVersion));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,clerkId,username,displayName,bio,avatarUrl,bannerUrl,location,tag,available,responseTime,followersCount,followingCount,phone,role,agreementVersion);
}

@override
String toString() {
    return 'Profile(clerkId: $clerkId, username: $username, displayName: $displayName, bio: $bio, avatarUrl: $avatarUrl, bannerUrl: $bannerUrl, location: $location, tag: $tag, available: $available, responseTime: $responseTime, followersCount: $followersCount, followingCount: $followingCount, phone: $phone, role: $role, agreementVersion: $agreementVersion)';
}


}

/// @nodoc
abstract mixin class _$ProfileCopyWith<$Res> implements $ProfileCopyWith<$Res> {
  factory _$ProfileCopyWith(_Profile value, $Res Function(_Profile) _then) = __$ProfileCopyWithImpl;
@override @useResult
$Res call({
 String clerkId, String? username, String? displayName, String? bio, String? avatarUrl, String? bannerUrl, String? location, String? tag, bool available, String? responseTime, int followersCount, int followingCount, String? phone, String? role, String? agreementVersion
});




}
/// @nodoc
class __$ProfileCopyWithImpl<$Res>
    implements _$ProfileCopyWith<$Res> {
  __$ProfileCopyWithImpl(this._self, this._then);

  final _Profile _self;
  final $Res Function(_Profile) _then;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? clerkId = null,Object? username = freezed,Object? displayName = freezed,Object? bio = freezed,Object? avatarUrl = freezed,Object? bannerUrl = freezed,Object? location = freezed,Object? tag = freezed,Object? available = null,Object? responseTime = freezed,Object? followersCount = null,Object? followingCount = null,Object? phone = freezed,Object? role = freezed,Object? agreementVersion = freezed,}) {
  return _then(_Profile(
clerkId: null == clerkId ? _self.clerkId : clerkId // ignore: cast_nullable_to_non_nullable
as String,username: freezed == username ? _self.username : username // ignore: cast_nullable_to_non_nullable
as String?,displayName: freezed == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,bannerUrl: freezed == bannerUrl ? _self.bannerUrl : bannerUrl // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,tag: freezed == tag ? _self.tag : tag // ignore: cast_nullable_to_non_nullable
as String?,available: null == available ? _self.available : available // ignore: cast_nullable_to_non_nullable
as bool,responseTime: freezed == responseTime ? _self.responseTime : responseTime // ignore: cast_nullable_to_non_nullable
as String?,followersCount: null == followersCount ? _self.followersCount : followersCount // ignore: cast_nullable_to_non_nullable
as int,followingCount: null == followingCount ? _self.followingCount : followingCount // ignore: cast_nullable_to_non_nullable
as int,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,agreementVersion: freezed == agreementVersion ? _self.agreementVersion : agreementVersion // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
