import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ortists/core/api/api_client.dart';
import 'package:ortists/core/api/api_exception.dart';

DioException _httpError(int status, [Object? data]) {
  final req = RequestOptions(path: '/x');
  return DioException(
    requestOptions: req,
    type: DioExceptionType.badResponse,
    response: Response<Object?>(requestOptions: req, statusCode: status, data: data),
  );
}

void main() {
  group('ApiException.fromDio', () {
    test('uses the server error message when present', () {
      final e = ApiException.fromDio(_httpError(400, {'error': 'Add a title'}));
      expect(e.message, 'Add a title');
      expect(e.statusCode, 400);
    });

    test('gives plain messages for common statuses', () {
      expect(ApiException.fromDio(_httpError(401)).isUnauthorized, isTrue);
      expect(ApiException.fromDio(_httpError(401)).message, 'Please sign in to continue.');
      expect(ApiException.fromDio(_httpError(503)).message, contains('our side'));
    });

    test('explains network problems', () {
      final e = ApiException.fromDio(
        DioException(
          requestOptions: RequestOptions(path: '/x'),
          type: DioExceptionType.connectionError,
        ),
      );
      expect(e.message, contains('No internet'));
    });
  });

  group('AuthInterceptor', () {
    Future<Map<String, dynamic>> headersFor(String? token) async {
      final dio = buildDio(getToken: () async => token, baseUrl: 'http://test');
      late Map<String, dynamic> seen;
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (o, h) {
            seen = o.headers;
            h.resolve(Response<Object?>(requestOptions: o, statusCode: 200));
          },
        ),
      );
      await dio.get<Object?>('/posts');
      return seen;
    }

    test('adds the bearer token when signed in', () async {
      expect((await headersFor('abc'))['Authorization'], 'Bearer abc');
    });

    test('sends no auth header for guests', () async {
      expect((await headersFor(null)).containsKey('Authorization'), isFalse);
    });
  });
}
