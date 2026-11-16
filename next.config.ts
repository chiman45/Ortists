import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Request bodies passing through middleware are buffered and cut off at
    // 10 MB by default, which broke uploads of large phone photos.
    proxyClientMaxBodySize: "50mb",
    // The image optimizer downloads each photo from Supabase before resizing it.
    // With many full-size photos loading at once on the feed, the default 7s
    // limit was hit and images failed with 500 / TimeoutError.
    imgOptTimeoutInSeconds: 30,
  },
  async redirects() {
    return [
      { source: "/marketplace", destination: "/gallery", permanent: true },
      { source: "/marketplace/:path*", destination: "/gallery/:path*", permanent: true },
    ];
  },
  images: {
    // Keep resized images cached for a week so each photo is fetched from Supabase once, not every hour
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "aklpjtcsrjxfruzkgzne.supabase.co" },
    ],
  },
};

export default nextConfig;
