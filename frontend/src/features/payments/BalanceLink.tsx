"use client";

import Link from "next/link";
import { formatXof } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { ChevronIcon } from "@/ui/icons";
import { getWallet } from "./api";

// Tester home shortcut: the balance stays out of the way if the wallet cannot load.
export function BalanceLink() {
  const { data: wallet, error } = useApi(getWallet);
  const amount = wallet ? formatXof(wallet.balance_xof) : error ? "Voir le détail" : "...";

  return (
    <Link
      href="/testeur/gains"
      className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 transition-colors duration-150 hover:border-ink/40 md:p-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
          Mes gains
        </span>
        <span data-testid="home-balance" className="font-display text-[28px] font-extrabold leading-tight text-accent">
          {amount}
        </span>
      </div>
      <ChevronIcon
        size={20}
        className="shrink-0 -rotate-90 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  );
}
