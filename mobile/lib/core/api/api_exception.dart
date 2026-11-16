import 'package:dio/dio.dart';

/// A failed API call, with a plain-language [message] safe to show users.
class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;

  factory ApiException.fromDio(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const ApiException('The connection timed out. Please try again.');
      case DioExceptionType.connectionError:
        return const ApiException('No internet connection. Check your network and try again.');
      case DioExceptionType.cancel:
        return const ApiException('Request cancelled.');
      default:
        break;
    }

    final status = e.response?.statusCode;
    final data = e.response?.data;
    // Our API routes answer errors as { "error": "…" }
    final serverMsg = data is Map && data['error'] is String ? data['error'] as String : null;

    final message =
        serverMsg ??
        switch (status) {
          401 => 'Please sign in to continue.',
          403 => "You don't have permission to do that.",
          404 => 'Not found.',
          413 => 'That file is too large.',
          final s? when s >= 500 => 'Something went wrong on our side. Please try again.',
          _ => 'Something went wrong. Please try again.',
        };
    return ApiException(message, statusCode: status);
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}
