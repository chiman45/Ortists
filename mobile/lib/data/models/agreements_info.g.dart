// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreements_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AgreementsInfo _$AgreementsInfoFromJson(Map<String, dynamic> json) => _AgreementsInfo(
  version: json['version'] as String,
  required: (json['required'] as Map<String, dynamic>).map(
    (k, e) => MapEntry(
      k,
      (e as List<dynamic>).map((e) => AgreementDoc.fromJson(e as Map<String, dynamic>)).toList(),
    ),
  ),
);

Map<String, dynamic> _$AgreementsInfoToJson(_AgreementsInfo instance) => <String, dynamic>{
  'version': instance.version,
  'required': instance.required.map((k, e) => MapEntry(k, e.map((e) => e.toJson()).toList())),
};

_AgreementDoc _$AgreementDocFromJson(Map<String, dynamic> json) =>
    _AgreementDoc(key: json['key'] as String, title: json['title'] as String, path: json['path'] as String);

Map<String, dynamic> _$AgreementDocToJson(_AgreementDoc instance) => <String, dynamic>{
  'key': instance.key,
  'title': instance.title,
  'path': instance.path,
};
