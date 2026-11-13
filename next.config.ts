import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Request bodies passing through middleware are buffered and cut off at
    // 10 MB by default, which broke uploads of large phone photos.
    proxyClientMaxBodySize: "50mb",
  },
  async redirects() {
    return [
      { source: "/marketplace", destination: "/gallery", permanent: true },
      { source: "/marketplace/:path*", destination: "/gallery/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "aklpjtcsrjxfruzkgzne.supabase.co" },
    ],
  },
};

export default nextConfig;
