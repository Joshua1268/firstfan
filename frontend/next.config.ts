import type { NextConfig } from "next";
import { apiBaseUrl } from "./src/lib/api-url";

const apiUrl = apiBaseUrl();

const nextConfig: NextConfig = {
  // Build séparé pour le projet e2e « api-down » (voir playwright.config.ts) ; `.next` par défaut.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
