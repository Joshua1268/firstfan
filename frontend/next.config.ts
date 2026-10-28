import type { NextConfig } from "next";
import { apiBaseUrl } from "./src/lib/api-url";

const apiUrl = apiBaseUrl();

const nextConfig: NextConfig = {
  // Separate build for the api-down e2e project.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { unoptimized: true },
  // Django wants the trailing slash and Next strips it: both redirects would loop on proxied API URLs.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*/", destination: `${apiUrl}/api/:path*/` },
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
