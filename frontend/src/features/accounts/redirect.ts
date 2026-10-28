import type { Me } from "./types";

// Only a path on this site: "//host" and "/\host" would leave it.
function isLocalPath(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
}

export function homeFor(me: Me, next?: string | null): string {
  if (next && isLocalPath(next)) return next;
  if (me.role === "dev") return "/dev";
  if (me.role === "tester") return me.profile_complete ? "/testeur" : "/testeur/profil";
  return "/";
}
