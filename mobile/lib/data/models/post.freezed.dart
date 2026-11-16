// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'post.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Post {

 String get id; String get userId; String get authorName; String get authorUsername; String? get authorAvatar; String get title; String? get description; String get imageUrl; String? get category; List<String> get tags; String? get medium; String? get style; String? get location; bool get allowComments; int get likesCount; int get commentsCount; int get savesCount; DateTime? get createdAt; List<String> get galleryUrls;
/// Create a copy of Post
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PostCopyWith<Post> get copyWith => _$PostCopyWithImpl<Post>(this as Post, _$identity);

  /// Serializes this Post to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Post;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Post&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.userId, _this.userId) || other.userId == _this.userId)&&(identical(other.authorName, _this.authorName) || other.authorName == _this.authorName)&&(identical(other.authorUsername, _this.authorUsername) || other.authorUsername == _this.authorUsername)&&(identical(other.authorAvatar, _this.authorAvatar) || other.authorAvatar == _this.authorAvatar)&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.description, _this.description) || other.description == _this.description)&&(identical(other.imageUrl, _this.imageUrl) || other.imageUrl == _this.imageUrl)&&(identical(other.category, _this.category) || other.category == _this.category)&&const DeepCollectionEquality().equals(other.tags, _this.tags)&&(identical(other.medium, _this.medium) || other.medium == _this.medium)&&(identical(other.style, _this.style) || other.style == _this.style)&&(identical(other.location, _this.location) || other.location == _this.location)&&(identical(other.allowComments, _this.allowComments) || other.allowComments == _this.allowComments)&&(identical(other.likesCount, _this.likesCount) || other.likesCount == _this.likesCount)&&(identical(other.commentsCount, _this.commentsCount) || other.commentsCount == _this.commentsCount)&&(identical(other.savesCount, _this.savesCount) || other.savesCount == _this.savesCount)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&const DeepCollectionEquality().equals(other.galleryUrls, _this.galleryUrls));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Post;
  return Object.hashAll([runtimeType,_this.id,_this.userId,_this.authorName,_this.authorUsername,_this.authorAvatar,_this.title,_this.description,_this.imageUrl,_this.category,const DeepCollectionEquality().hash(_this.tags),_this.medium,_this.style,_this.location,_this.allowComments,_this.likesCount,_this.commentsCount,_this.savesCount,_this.createdAt,const DeepCollectionEquality().hash(_this.galleryUrls)]);
}

@override
String toString() {
  final _this = this as Post;
  return 'Post(id: ${_this.id}, userId: ${_this.userId}, authorName: ${_this.authorName}, authorUsername: ${_this.authorUsername}, authorAvatar: ${_this.authorAvatar}, title: ${_this.title}, description: ${_this.description}, imageUrl: ${_this.imageUrl}, category: ${_this.category}, tags: ${_this.tags}, medium: ${_this.medium}, style: ${_this.style}, location: ${_this.location}, allowComments: ${_this.allowComments}, likesCount: ${_this.likesCount}, commentsCount: ${_this.commentsCount}, savesCount: ${_this.savesCount}, createdAt: ${_this.createdAt}, galleryUrls: ${_this.galleryUrls})';
}


}

/// @nodoc
abstract mixin class $PostCopyWith<$Res>  {
  factory $PostCopyWith(Post value, $Res Function(Post) _then) = _$PostCopyWithImpl;
@useResult
$Res call({
 String id, String userId, String authorName, String authorUsername, String? authorAvatar, String title, String? description, String imageUrl, String? category, List<String> tags, String? medium, String? style, String? location, bool allowComments, int likesCount, int commentsCount, int savesCount, DateTime? createdAt, List<String> galleryUrls
});




}
/// @nodoc
class _$PostCopyWithImpl<$Res>
    implements $PostCopyWith<$Res> {
  _$PostCopyWithImpl(this._self, this._then);

  final Post _self;
  final $Res Function(Post) _then;

/// Create a copy of Post
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? userId = null,Object? authorName = null,Object? authorUsername = null,Object? authorAvatar = freezed,Object? title = null,Object? description = freezed,Object? imageUrl = null,Object? category = freezed,Object? tags = null,Object? medium = freezed,Object? style = freezed,Object? location = freezed,Object? allowComments = null,Object? likesCount = null,Object? commentsCount = null,Object? savesCount = null,Object? createdAt = freezed,Object? galleryUrls = null,}) {
  return _then(Post(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,authorUsername: null == authorUsername ? _self.authorUsername : authorUsername // ignore: cast_nullable_to_non_nullable
as String,authorAvatar: freezed == authorAvatar ? _self.authorAvatar : authorAvatar // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,imageUrl: null == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String?,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,medium: freezed == medium ? _self.medium : medium // ignore: cast_nullable_to_non_nullable
as String?,style: freezed == style ? _self.style : style // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,allowComments: null == allowComments ? _self.allowComments : allowComments // ignore: cast_nullable_to_non_nullable
as bool,likesCount: null == likesCount ? _self.likesCount : likesCount // ignore: cast_nullable_to_non_nullable
as int,commentsCount: null == commentsCount ? _self.commentsCount : commentsCount // ignore: cast_nullable_to_non_nullable
as int,savesCount: null == savesCount ? _self.savesCount : savesCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,galleryUrls: null == galleryUrls ? _self.galleryUrls : galleryUrls // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [Post].
extension PostPatterns on Post {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Post value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Post() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Post value)  $default,){
final _that = this;
switch (_that) {
case _Post():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Post value)?  $default,){
final _that = this;
switch (_that) {
case _Post() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String userId,  String authorName,  String authorUsername,  String? authorAvatar,  String title,  String? description,  String imageUrl,  String? category,  List<String> tags,  String? medium,  String? style,  String? location,  bool allowComments,  int likesCount,  int commentsCount,  int savesCount,  DateTime? createdAt,  List<String> galleryUrls)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Post() when $default != null:
return $default(_that.id,_that.userId,_that.authorName,_that.authorUsername,_that.authorAvatar,_that.title,_that.description,_that.imageUrl,_that.category,_that.tags,_that.medium,_that.style,_that.location,_that.allowComments,_that.likesCount,_that.commentsCount,_that.savesCount,_that.createdAt,_that.galleryUrls);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String userId,  String authorName,  String authorUsername,  String? authorAvatar,  String title,  String? description,  String imageUrl,  String? category,  List<String> tags,  String? medium,  String? style,  String? location,  bool allowComments,  int likesCount,  int commentsCount,  int savesCount,  DateTime? createdAt,  List<String> galleryUrls)  $default,) {final _that = this;
switch (_that) {
case _Post():
return $default(_that.id,_that.userId,_that.authorName,_that.authorUsername,_that.authorAvatar,_that.title,_that.description,_that.imageUrl,_that.category,_that.tags,_that.medium,_that.style,_that.location,_that.allowComments,_that.likesCount,_that.commentsCount,_that.savesCount,_that.createdAt,_that.galleryUrls);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String userId,  String authorName,  String authorUsername,  String? authorAvatar,  String title,  String? description,  String imageUrl,  String? category,  List<String> tags,  String? medium,  String? style,  String? location,  bool allowComments,  int likesCount,  int commentsCount,  int savesCount,  DateTime? createdAt,  List<String> galleryUrls)?  $default,) {final _that = this;
switch (_that) {
case _Post() when $default != null:
return $default(_that.id,_that.userId,_that.authorName,_that.authorUsername,_that.authorAvatar,_that.title,_that.description,_that.imageUrl,_that.category,_that.tags,_that.medium,_that.style,_that.location,_that.allowComments,_that.likesCount,_that.commentsCount,_that.savesCount,_that.createdAt,_that.galleryUrls);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Post extends Post {
  const _Post({required this.id, this.userId = '', this.authorName = '', this.authorUsername = '', this.authorAvatar, this.title = 'Untitled', this.description, this.imageUrl = '', this.category,  List<String> tags = const <String>[], this.medium, this.style, this.location, this.allowComments = true, this.likesCount = 0, this.commentsCount = 0, this.savesCount = 0, this.createdAt,  List<String> galleryUrls = const <String>[]}): _tags = tags,_galleryUrls = galleryUrls,super._();
  factory _Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);

@override final  String id;
@override@JsonKey() final  String userId;
@override@JsonKey() final  String authorName;
@override@JsonKey() final  String authorUsername;
@override final  String? authorAvatar;
@override@JsonKey() final  String title;
@override final  String? description;
@override@JsonKey() final  String imageUrl;
@override final  String? category;
 final  List<String> _tags;
@override@JsonKey() List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override final  String? medium;
@override final  String? style;
@override final  String? location;
@override@JsonKey() final  bool allowComments;
@override@JsonKey() final  int likesCount;
@override@JsonKey() final  int commentsCount;
@override@JsonKey() final  int savesCount;
@override final  DateTime? createdAt;
 final  List<String> _galleryUrls;
@override@JsonKey() List<String> get galleryUrls {
  if (_galleryUrls is EqualUnmodifiableListView) return _galleryUrls;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_galleryUrls);
}


/// Create a copy of Post
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PostCopyWith<_Post> get copyWith => __$PostCopyWithImpl<_Post>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PostToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Post&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.authorUsername, authorUsername) || other.authorUsername == authorUsername)&&(identical(other.authorAvatar, authorAvatar) || other.authorAvatar == authorAvatar)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other.tags, _tags)&&(identical(other.medium, medium) || other.medium == medium)&&(identical(other.style, style) || other.style == style)&&(identical(other.location, location) || other.location == location)&&(identical(other.allowComments, allowComments) || other.allowComments == allowComments)&&(identical(other.likesCount, likesCount) || other.likesCount == likesCount)&&(identical(other.commentsCount, commentsCount) || other.commentsCount == commentsCount)&&(identical(other.savesCount, savesCount) || other.savesCount == savesCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&const DeepCollectionEquality().equals(other.galleryUrls, _galleryUrls));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hashAll([runtimeType,id,userId,authorName,authorUsername,authorAvatar,title,description,imageUrl,category,const DeepCollectionEquality().hash(_tags),medium,style,location,allowComments,likesCount,commentsCount,savesCount,createdAt,const DeepCollectionEquality().hash(_galleryUrls)]);
}

@override
String toString() {
    return 'Post(id: $id, userId: $userId, authorName: $authorName, authorUsername: $authorUsername, authorAvatar: $authorAvatar, title: $title, description: $description, imageUrl: $imageUrl, category: $category, tags: $tags, medium: $medium, style: $style, location: $location, allowComments: $allowComments, likesCount: $likesCount, commentsCount: $commentsCount, savesCount: $savesCount, createdAt: $createdAt, galleryUrls: $galleryUrls)';
}


}

/// @nodoc
abstract mixin class _$PostCopyWith<$Res> implements $PostCopyWith<$Res> {
  factory _$PostCopyWith(_Post value, $Res Function(_Post) _then) = __$PostCopyWithImpl;
@override @useResult
$Res call({
 String id, String userId, String authorName, String authorUsername, String? authorAvatar, String title, String? description, String imageUrl, String? category, List<String> tags, String? medium, String? style, String? location, bool allowComments, int likesCount, int commentsCount, int savesCount, DateTime? createdAt, List<String> galleryUrls
});




}
/// @nodoc
class __$PostCopyWithImpl<$Res>
    implements _$PostCopyWith<$Res> {
  __$PostCopyWithImpl(this._self, this._then);

  final _Post _self;
  final $Res Function(_Post) _then;

/// Create a copy of Post
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? userId = null,Object? authorName = null,Object? authorUsername = null,Object? authorAvatar = freezed,Object? title = null,Object? description = freezed,Object? imageUrl = null,Object? category = freezed,Object? tags = null,Object? medium = freezed,Object? style = freezed,Object? location = freezed,Object? allowComments = null,Object? likesCount = null,Object? commentsCount = null,Object? savesCount = null,Object? createdAt = freezed,Object? galleryUrls = null,}) {
  return _then(_Post(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,authorUsername: null == authorUsername ? _self.authorUsername : authorUsername // ignore: cast_nullable_to_non_nullable
as String,authorAvatar: freezed == authorAvatar ? _self.authorAvatar : authorAvatar // ignore: cast_nullable_to_non_nullable
as String?,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,imageUrl: null == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String,category: freezed == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String?,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,medium: freezed == medium ? _self.medium : medium // ignore: cast_nullable_to_non_nullable
as String?,style: freezed == style ? _self.style : style // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,allowComments: null == allowComments ? _self.allowComments : allowComments // ignore: cast_nullable_to_non_nullable
as bool,likesCount: null == likesCount ? _self.likesCount : likesCount // ignore: cast_nullable_to_non_nullable
as int,commentsCount: null == commentsCount ? _self.commentsCount : commentsCount // ignore: cast_nullable_to_non_nullable
as int,savesCount: null == savesCount ? _self.savesCount : savesCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,galleryUrls: null == galleryUrls ? _self._galleryUrls : galleryUrls // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}

// dart format on
