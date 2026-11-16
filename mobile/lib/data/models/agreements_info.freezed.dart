// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'agreements_info.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AgreementsInfo {

 String get version; Map<String, List<AgreementDoc>> get required;
/// Create a copy of AgreementsInfo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AgreementsInfoCopyWith<AgreementsInfo> get copyWith => _$AgreementsInfoCopyWithImpl<AgreementsInfo>(this as AgreementsInfo, _$identity);

  /// Serializes this AgreementsInfo to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as AgreementsInfo;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AgreementsInfo&&(identical(other.version, _this.version) || other.version == _this.version)&&const DeepCollectionEquality().equals(other.required, _this.required));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as AgreementsInfo;
  return Object.hash(runtimeType,_this.version,const DeepCollectionEquality().hash(_this.required));
}

@override
String toString() {
  final _this = this as AgreementsInfo;
  return 'AgreementsInfo(version: ${_this.version}, required: ${_this.required})';
}


}

/// @nodoc
abstract mixin class $AgreementsInfoCopyWith<$Res>  {
  factory $AgreementsInfoCopyWith(AgreementsInfo value, $Res Function(AgreementsInfo) _then) = _$AgreementsInfoCopyWithImpl;
@useResult
$Res call({
 String version, Map<String, List<AgreementDoc>> required
});




}
/// @nodoc
class _$AgreementsInfoCopyWithImpl<$Res>
    implements $AgreementsInfoCopyWith<$Res> {
  _$AgreementsInfoCopyWithImpl(this._self, this._then);

  final AgreementsInfo _self;
  final $Res Function(AgreementsInfo) _then;

/// Create a copy of AgreementsInfo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? version = null,Object? required = null,}) {
  return _then(AgreementsInfo(
version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as String,required: null == required ? _self.required : required // ignore: cast_nullable_to_non_nullable
as Map<String, List<AgreementDoc>>,
  ));
}

}


/// Adds pattern-matching-related methods to [AgreementsInfo].
extension AgreementsInfoPatterns on AgreementsInfo {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AgreementsInfo value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AgreementsInfo() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AgreementsInfo value)  $default,){
final _that = this;
switch (_that) {
case _AgreementsInfo():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AgreementsInfo value)?  $default,){
final _that = this;
switch (_that) {
case _AgreementsInfo() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String version,  Map<String, List<AgreementDoc>> required)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AgreementsInfo() when $default != null:
return $default(_that.version,_that.required);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String version,  Map<String, List<AgreementDoc>> required)  $default,) {final _that = this;
switch (_that) {
case _AgreementsInfo():
return $default(_that.version,_that.required);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String version,  Map<String, List<AgreementDoc>> required)?  $default,) {final _that = this;
switch (_that) {
case _AgreementsInfo() when $default != null:
return $default(_that.version,_that.required);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AgreementsInfo implements AgreementsInfo {
  const _AgreementsInfo({required this.version, required  Map<String, List<AgreementDoc>> required}): _required = required;
  factory _AgreementsInfo.fromJson(Map<String, dynamic> json) => _$AgreementsInfoFromJson(json);

@override final  String version;
 final  Map<String, List<AgreementDoc>> _required;
@override Map<String, List<AgreementDoc>> get required {
  if (_required is EqualUnmodifiableMapView) return _required;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_required);
}


/// Create a copy of AgreementsInfo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AgreementsInfoCopyWith<_AgreementsInfo> get copyWith => __$AgreementsInfoCopyWithImpl<_AgreementsInfo>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AgreementsInfoToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _AgreementsInfo&&(identical(other.version, version) || other.version == version)&&const DeepCollectionEquality().equals(other.required, _required));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,version,const DeepCollectionEquality().hash(_required));
}

@override
String toString() {
    return 'AgreementsInfo(version: $version, required: $required)';
}


}

/// @nodoc
abstract mixin class _$AgreementsInfoCopyWith<$Res> implements $AgreementsInfoCopyWith<$Res> {
  factory _$AgreementsInfoCopyWith(_AgreementsInfo value, $Res Function(_AgreementsInfo) _then) = __$AgreementsInfoCopyWithImpl;
@override @useResult
$Res call({
 String version, Map<String, List<AgreementDoc>> required
});




}
/// @nodoc
class __$AgreementsInfoCopyWithImpl<$Res>
    implements _$AgreementsInfoCopyWith<$Res> {
  __$AgreementsInfoCopyWithImpl(this._self, this._then);

  final _AgreementsInfo _self;
  final $Res Function(_AgreementsInfo) _then;

/// Create a copy of AgreementsInfo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? version = null,Object? required = null,}) {
  return _then(_AgreementsInfo(
version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as String,required: null == required ? _self._required : required // ignore: cast_nullable_to_non_nullable
as Map<String, List<AgreementDoc>>,
  ));
}


}


/// @nodoc
mixin _$AgreementDoc {

 String get key; String get title;/// Website path of the full document, e.g. `/terms`.
 String get path;
/// Create a copy of AgreementDoc
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AgreementDocCopyWith<AgreementDoc> get copyWith => _$AgreementDocCopyWithImpl<AgreementDoc>(this as AgreementDoc, _$identity);

  /// Serializes this AgreementDoc to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as AgreementDoc;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AgreementDoc&&(identical(other.key, _this.key) || other.key == _this.key)&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.path, _this.path) || other.path == _this.path));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as AgreementDoc;
  return Object.hash(runtimeType,_this.key,_this.title,_this.path);
}

@override
String toString() {
  final _this = this as AgreementDoc;
  return 'AgreementDoc(key: ${_this.key}, title: ${_this.title}, path: ${_this.path})';
}


}

/// @nodoc
abstract mixin class $AgreementDocCopyWith<$Res>  {
  factory $AgreementDocCopyWith(AgreementDoc value, $Res Function(AgreementDoc) _then) = _$AgreementDocCopyWithImpl;
@useResult
$Res call({
 String key, String title, String path
});




}
/// @nodoc
class _$AgreementDocCopyWithImpl<$Res>
    implements $AgreementDocCopyWith<$Res> {
  _$AgreementDocCopyWithImpl(this._self, this._then);

  final AgreementDoc _self;
  final $Res Function(AgreementDoc) _then;

/// Create a copy of AgreementDoc
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? key = null,Object? title = null,Object? path = null,}) {
  return _then(AgreementDoc(
key: null == key ? _self.key : key // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,path: null == path ? _self.path : path // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [AgreementDoc].
extension AgreementDocPatterns on AgreementDoc {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AgreementDoc value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AgreementDoc() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AgreementDoc value)  $default,){
final _that = this;
switch (_that) {
case _AgreementDoc():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AgreementDoc value)?  $default,){
final _that = this;
switch (_that) {
case _AgreementDoc() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String key,  String title,  String path)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AgreementDoc() when $default != null:
return $default(_that.key,_that.title,_that.path);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String key,  String title,  String path)  $default,) {final _that = this;
switch (_that) {
case _AgreementDoc():
return $default(_that.key,_that.title,_that.path);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String key,  String title,  String path)?  $default,) {final _that = this;
switch (_that) {
case _AgreementDoc() when $default != null:
return $default(_that.key,_that.title,_that.path);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AgreementDoc implements AgreementDoc {
  const _AgreementDoc({required this.key, required this.title, required this.path});
  factory _AgreementDoc.fromJson(Map<String, dynamic> json) => _$AgreementDocFromJson(json);

@override final  String key;
@override final  String title;
/// Website path of the full document, e.g. `/terms`.
@override final  String path;

/// Create a copy of AgreementDoc
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AgreementDocCopyWith<_AgreementDoc> get copyWith => __$AgreementDocCopyWithImpl<_AgreementDoc>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AgreementDocToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _AgreementDoc&&(identical(other.key, key) || other.key == key)&&(identical(other.title, title) || other.title == title)&&(identical(other.path, path) || other.path == path));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,key,title,path);
}

@override
String toString() {
    return 'AgreementDoc(key: $key, title: $title, path: $path)';
}


}

/// @nodoc
abstract mixin class _$AgreementDocCopyWith<$Res> implements $AgreementDocCopyWith<$Res> {
  factory _$AgreementDocCopyWith(_AgreementDoc value, $Res Function(_AgreementDoc) _then) = __$AgreementDocCopyWithImpl;
@override @useResult
$Res call({
 String key, String title, String path
});




}
/// @nodoc
class __$AgreementDocCopyWithImpl<$Res>
    implements _$AgreementDocCopyWith<$Res> {
  __$AgreementDocCopyWithImpl(this._self, this._then);

  final _AgreementDoc _self;
  final $Res Function(_AgreementDoc) _then;

/// Create a copy of AgreementDoc
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? key = null,Object? title = null,Object? path = null,}) {
  return _then(_AgreementDoc(
key: null == key ? _self.key : key // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,path: null == path ? _self.path : path // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
