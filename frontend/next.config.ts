import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the production image (node server.js).
  output: "standalone",
  // Separate build for the api-down e2e project.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The dev server is opened at 127.0.0.1, the origin Django trusts for CSRF.
  allowedDevOrigins: ["127.0.0.1"],
  images: { unoptimized: true },
  // Room for three 5 MB captures (default 10 MB).
  experimental: { proxyClientMaxBodySize: "20mb" },
  // Django wants the trailing slash: avoids a redirect loop.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
