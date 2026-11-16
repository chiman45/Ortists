import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/tokens.dart';
import '../../../data/models/post.dart';

/// Short count for likes and followers: 950, 1.2k, 34k, 1.5M.
String compactCount(int n) {
  if (n < 1000) return '$n';
  if (n < 10000) return '${(n / 1000).toStringAsFixed(1).replaceFirst(RegExp(r'\.0$'), '')}k';
  if (n < 1000000) return '${n ~/ 1000}k';
  return '${(n / 1000000).toStringAsFixed(1).replaceFirst(RegExp(r'\.0$'), '')}M';
}

/// One tile of the masonry grid: the artwork at its natural shape, then the
/// artist and like count.
class PostCard extends StatelessWidget {
  const PostCard({super.key, required this.post, required this.onTap});

  final Post post;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      button: true,
      label: '${post.title} by ${post.authorName}',
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  ArtworkImage(url: post.imageUrl, placeholderHeight: 180),
                  if (post.price != null)
                    Positioned(
                      left: 8,
                      bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(Radii.pill),
                        ),
                        child: Text(
                          post.price!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Avatar(url: post.authorAvatar, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    post.authorName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: c.text2, fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                ),
                Icon(Icons.favorite_border_rounded, size: 13, color: c.text5),
                const SizedBox(width: 3),
                Text(compactCount(post.likesCount), style: TextStyle(color: c.text5, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// A network artwork that takes the full width and its own natural height.
class ArtworkImage extends StatelessWidget {
  const ArtworkImage({super.key, required this.url, this.placeholderHeight = 240});

  final String url;
  final double placeholderHeight;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    Widget box(Widget? child) =>
        Container(height: placeholderHeight, width: double.infinity, color: c.subtle, child: child);
    if (url.isEmpty) return box(Icon(Icons.image_not_supported_outlined, color: c.text6));
    return CachedNetworkImage(
      imageUrl: url,
      width: double.infinity,
      fit: BoxFit.fitWidth,
      fadeInDuration: const Duration(milliseconds: 150),
      placeholder: (_, _) => box(null),
      errorWidget: (_, _, _) => box(Icon(Icons.broken_image_outlined, color: c.text6)),
    );
  }
}

/// Round profile picture with a neutral fallback.
class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.url, this.size = 36});

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final has = url != null && url!.isNotEmpty;
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: c.muted,
      foregroundImage: has ? CachedNetworkImageProvider(url!) : null,
      child: Icon(Icons.person_rounded, size: size * 0.6, color: c.text5),
    );
  }
}
