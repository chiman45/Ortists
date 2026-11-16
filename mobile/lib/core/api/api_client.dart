import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/session.dart';
import '../config/env.dart';
import 'api_exception.dart';

/// Returns the current session token, or null for guests.
typedef TokenGetter = Future<String?> Function();

final tokenGetterProvider = Provider<TokenGetter>((ref) => ref.watch(authRepositoryProvider).sessionToken);

/// Shared HTTP client for `/api/*` on the Next.js backend.
final dioProvider = Provider<Dio>((ref) {
  final getToken = ref.watch(tokenGetterProvider);
  return buildDio(getToken: getToken);
});

Dio buildDio({required TokenGetter getToken, String baseUrl = Env.apiBaseUrl}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: '$baseUrl/api',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Accept': 'application/json'},
    ),
  );
  dio.interceptors.add(AuthInterceptor(getToken));
  return dio;
}

/// Adds `Authorization: Bearer <token>` when signed in. The server verifies it
/// with Clerk `auth()` (see `src/lib/apiAuth.ts` in the web repo).
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._getToken);
  final TokenGetter _getToken;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

/// Runs [request] and converts any failure into an [ApiException] with a
/// message that can be shown to the user as-is.
Future<T> guard<T>(Future<T> Function() request) async {
  try {
    return await request();
  } on DioException catch (e) {
    throw ApiException.fromDio(e);
  }
}
