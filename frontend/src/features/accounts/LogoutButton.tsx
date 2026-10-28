"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "./api";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function leave() {
    setBusy(true);
    try {
      await logout();
    } finally {
      // Even if the call failed, the login page is the right place to go.
      router.replace("/connexion");
    }
  }

  return (
    <button
      type="button"
      onClick={leave}
      disabled={busy}
      className="inline-flex min-h-11 items-center rounded-pill border border-line px-4 text-[14px] font-medium text-ink transition-colors duration-150 hover:border-ink/60 disabled:opacity-60"
    >
      Se déconnecter
    </button>
  );
}
