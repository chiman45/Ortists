import 'package:freezed_annotation/freezed_annotation.dart';

part 'profile.freezed.dart';
part 'profile.g.dart';

/// A row of the `profiles` table, as returned by `/api/profiles` and
/// `/api/profile/sync`. `phone` is only present on your own profile.
@freezed
abstract class Profile with _$Profile {
  const factory Profile({
    required String clerkId,
    String? username,
    String? displayName,
    String? bio,
    String? avatarUrl,
    String? bannerUrl,
    String? location,
    String? tag,
    @Default(true) bool available,
    String? responseTime,
    @Default(0) int followersCount,
    @Default(0) int followingCount,
    String? phone,

    /// "artist" or "client", chosen on the agreements step.
    String? role,
    String? agreementVersion,
  }) = _Profile;

  factory Profile.fromJson(Map<String, dynamic> json) => _$ProfileFromJson(json);
}
