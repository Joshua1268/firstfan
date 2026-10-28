"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import { LoadFailed } from "@/ui/LoadFailed";
import { getMe } from "./api";
import { homeFor } from "./redirect";
import type { Role } from "./types";

// Like @login_required for a whole space: anonymous visitors go to the login page, other roles to their own space.
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me, error, reload } = useApi(getMe);
  const anonymous = error?.status === 401 || error?.status === 403;

  useEffect(() => {
    if (anonymous) router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
    else if (me && me.role !== role) router.replace(homeFor(me));
  }, [anonymous, me, role, pathname, router]);

  if (me && me.role === role) return children;
  if (error && !anonymous) {
    return <LoadFailed message={error.detail ?? "Impossible de charger ton espace."} onRetry={reload} />;
  }
  return (
    <p role="status" className="text-[15px] text-ink-muted">
      Chargement de ton espace...
    </p>
  );
}
