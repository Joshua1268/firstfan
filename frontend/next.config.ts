import type { NextConfig } from "next";
import { apiBaseUrl } from "./src/lib/api-url";

const apiUrl = apiBaseUrl();

const nextConfig: NextConfig = {
  // Build séparé pour le projet e2e « api-down » (voir playwright.config.ts) ; `.next` par défaut.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: { unoptimized: true },
  // Django veut la barre finale (APPEND_SLASH) et Next la retire par défaut (308) : les deux redirections
  // bouclaient sur toute URL d'API réécrite (`/api/health/`). Next ne touche plus à la barre finale ; les URL
  // de l'app sont écrites sans barre finale, et la page 404 française couvre les variantes inconnues.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // La barre finale est transmise telle quelle (sans elle, Django répondrait par une 301 vers lui-même).
    return [
      { source: "/api/:path*/", destination: `${apiUrl}/api/:path*/` },
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;
