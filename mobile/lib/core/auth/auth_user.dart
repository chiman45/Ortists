import 'package:flutter/foundation.dart';

/// The signed-in person, as far as the login provider knows them.
/// Profile details (bio, phone, role…) live in `Profile` from our own API.
@immutable
class AuthUser {
  const AuthUser({required this.id, required this.name, this.username, this.email, this.imageUrl});

  /// Clerk user id — the same id the website stores as `clerk_id` / `user_id`.
  final String id;
  final String name;
  final String? username;
  final String? email;
  final String? imageUrl;

  @override
  bool operator ==(Object other) =>
      other is AuthUser &&
      other.id == id &&
      other.name == name &&
      other.username == username &&
      other.email == email &&
      other.imageUrl == imageUrl;

  @override
  int get hashCode => Object.hash(id, name, username, email, imageUrl);
}
