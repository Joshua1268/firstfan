import type { NextConfig } from "next";
import { apiBaseUrl } from "./src/lib/api-url";

const apiUrl = apiBaseUrl();

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
