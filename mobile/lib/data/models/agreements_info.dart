import 'package:freezed_annotation/freezed_annotation.dart';

part 'agreements_info.freezed.dart';
part 'agreements_info.g.dart';

/// `GET /api/agreements`: the current version and the documents each role
/// ("artist" / "client") must accept.
@freezed
abstract class AgreementsInfo with _$AgreementsInfo {
  const factory AgreementsInfo({required String version, required Map<String, List<AgreementDoc>> required}) =
      _AgreementsInfo;

  factory AgreementsInfo.fromJson(Map<String, dynamic> json) => _$AgreementsInfoFromJson(json);
}

@freezed
abstract class AgreementDoc with _$AgreementDoc {
  const factory AgreementDoc({
    required String key,
    required String title,

    /// Website path of the full document, e.g. `/terms`.
    required String path,
  }) = _AgreementDoc;

  factory AgreementDoc.fromJson(Map<String, dynamic> json) => _$AgreementDocFromJson(json);
}
