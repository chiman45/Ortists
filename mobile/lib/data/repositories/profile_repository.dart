import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_user.dart';
import '../models/agreements_info.dart';
import '../models/profile.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(dioProvider)),
);

/// Profiles and account set-up (`/api/profiles`, `/api/profile/*`, `/api/agreements`).
class ProfileRepository {
  ProfileRepository(this._dio);
  final Dio _dio;

  /// Looks a profile up by Clerk id or username. Null when there is none.
  Future<Profile?> fetch(String idOrUsername) => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/profiles',
      queryParameters: {'username': idOrUsername},
    );
    final json = res.data?['profile'];
    return json is Map<String, dynamic> ? Profile.fromJson(json) : null;
  });

  /// Creates the profile on first login (or returns the existing one).
  /// Mirrors the website's `ProfileSync`.
  Future<Profile> sync(AuthUser user, {String? phone}) => guard(() async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/profile/sync',
      data: {
        'clerk_id': user.id,
        'display_name': user.name,
        'username': user.username ?? (user.id.length > 12 ? user.id.substring(0, 12) : user.id),
        'avatar_url': user.imageUrl,
        'phone': phone,
      },
    );
    return Profile.fromJson(res.data!['profile'] as Map<String, dynamic>);
  });

  /// Updates fields on the signed-in user's own profile.
  Future<Profile> update(Map<String, Object?> fields) => guard(() async {
    final res = await _dio.patch<Map<String, dynamic>>('/profile/sync', data: fields);
    return Profile.fromJson(res.data!['profile'] as Map<String, dynamic>);
  });

  /// Whether no other account uses this phone number. Throws an
  /// [ApiException] with the server's message when the number is invalid.
  Future<bool> phoneAvailable(String phone) => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>('/profile/phone', queryParameters: {'phone': phone});
    return res.data?['available'] == true;
  });

  Future<AgreementsInfo> agreements() => guard(() async {
    final res = await _dio.get<Map<String, dynamic>>('/agreements');
    return AgreementsInfo.fromJson(res.data!);
  });
}
