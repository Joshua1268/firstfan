import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PUBLIC_PAGES = ["", "/testeurs", "/inscription", "/connexion", "/contact", "/confidentialite", "/conditions"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` }));
}
