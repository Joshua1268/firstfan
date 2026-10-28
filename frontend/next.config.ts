import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Separate build for the api-down e2e project.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The dev server is opened at 127.0.0.1, the origin Django trusts for CSRF.
  allowedDevOrigins: ["127.0.0.1"],
  images: { unoptimized: true },
  // Django wants the trailing slash and Next strips it: both redirects would loop on proxied API URLs.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
