import type { Me } from "./types";

// Any base works: it only tells whether next stays on the same site.
const SITE = "http://site.local";

// Parse next like the browser (drops tabs and newlines, reads "\" as "/").
function localPath(next: string): string | null {
  if (!next.startsWith("/")) return null;
  const url = new URL(next, SITE);
  if (url.origin !== SITE) return null;
  return url.pathname + url.search + url.hash;
}

export function homeFor(me: Me, next?: string | null): string {
  const path = next ? localPath(next) : null;
  if (path) return path;
  if (me.role === "dev") return "/dev";
  if (me.role === "tester") return me.profile_complete ? "/testeur" : "/testeur/profil";
  return "/";
}
