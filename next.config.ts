import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory explicitly. Without this,
  // Next.js infers it by scanning upward for lockfiles — a stray
  // package-lock.json anywhere above this folder (even an empty,
  // unrelated one) makes it pick the wrong root, which silently breaks
  // webpack's module/chunk resolution and shows up as intermittent
  // "Cannot read properties of undefined (reading 'call')" crashes in
  // dev. Setting this removes that failure mode for good, regardless
  // of whatever else ends up next to this project on disk.
  outputFileTracingRoot: path.join(__dirname),

  experimental: {
    serverActions: {
      allowedOrigins: [
        // awarizon.shop — all variants
        "awarizon.shop",
        "www.awarizon.shop",   // ← added: canonical www origin
        "*.awarizon.shop",
        // legacy / secondary domain
        "awarizonmall.com",
        "www.awarizonmall.com", // ← added: canonical www origin
        "*.awarizonmall.com",
        // local dev
        "localhost:3000",
      ],
    },
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // awarizon.shop subdomains (storefronts)
      { protocol: "https", hostname: "*.awarizon.shop" }, // ← added
      // legacy domain
      { protocol: "https", hostname: "*.awarizonmall.com" },
    ],
    unoptimized: false,
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options",           value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options",    value: "nosniff" },
      { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ]

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;