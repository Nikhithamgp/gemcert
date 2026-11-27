import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Every page here is per-request (sessions, live certificate status), so the
  // classic dynamic rendering model is used instead of Cache Components.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Photo uploads go through server actions; images are re-checked server-side.
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // QR codes now encode the shorter /v/<number> path (smaller, easier-to-scan QR).
    // Keep the old /verify paths working for any card printed before the change.
    return [
      { source: "/verify", destination: "/v", permanent: true },
      { source: "/verify/:number", destination: "/v/:number", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
