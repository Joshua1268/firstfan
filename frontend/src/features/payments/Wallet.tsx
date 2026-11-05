"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formatDateTime } from "@/lib/dates";
import { formatXof } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { ArrowIcon, CheckIcon, PhoneIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { StatusPill } from "@/ui/StatusPill";
import { getWallet } from "./api";
import type { Earning, Wallet as WalletData, Withdrawal } from "./types";
import { maskMomo, WITHDRAWAL_STATUS } from "./format";
import { WithdrawForm } from "./WithdrawForm";

const h2Cls = "text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink";
const kickerCls = "font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted";

export function Wallet() {
  const { data: wallet, error, reload } = useApi(getWallet);
  const [sent, setSent] = useState<Withdrawal>();

  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger tes gains."} onRetry={reload} />;
  if (!wallet) return <Loading label="Chargement de tes gains..." />;

  function done(withdrawal: Withdrawal) {
    setSent(withdrawal);
    reload();
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-10">
      <header className="flex flex-col gap-3">
        <SpaceTitle>Mes gains</SpaceTitle>
        <p className="max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">
          Chaque test validé crédite ton solde. Tu le retires quand tu veux sur ton numéro mobile money.
        </p>
      </header>

      <section
        aria-labelledby="wallet-balance-title"
        className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8"
      >
        <div className="flex flex-col gap-2">
          <h2 id="wallet-balance-title" className={kickerCls}>
            Solde disponible
          </h2>
          <p data-testid="wallet-balance" className="font-display text-[44px] font-extrabold leading-none text-accent">
            {formatXof(wallet.balance_xof)}
          </p>
        </div>
        {sent && (
          <p role="status" className="flex items-start gap-3 text-[15px] leading-snug text-ink">
            <CheckIcon size={20} strokeWidth={2} className="mt-px shrink-0 text-accent" />
            Retrait de {formatXof(sent.amount_xof)} envoyé sur le {sent.momo_number_masked}.
          </p>
        )}
        <WithdrawPanel wallet={wallet} onDone={done} />
      </section>

      <History title="Gains par test validé" empty="Aucun gain pour l'instant. Ton premier test validé apparaîtra ici.">
        {wallet.earnings.map((earning, i) => (
          <EarningRow key={i} earning={earning} />
        ))}
      </History>

      <History title="Retraits" empty="Aucun retrait pour l'instant.">
        {wallet.withdrawals.map((withdrawal, i) => (
          <WithdrawalRow key={i} withdrawal={withdrawal} />
        ))}
      </History>
    </div>
  );
}

function WithdrawPanel({ wallet, onDone }: { wallet: WalletData; onDone: (withdrawal: Withdrawal) => void }) {
  if (!wallet.momo_number) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-[15px] leading-snug text-ink">Ajoute ton numéro mobile money pour retirer ton solde.</p>
        <ProfileLink>Compléter mon profil</ProfileLink>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-[15px] text-ink-muted">
        <PhoneIcon size={18} className="shrink-0" />
        Versement sur le {maskMomo(wallet.momo_number)}
      </p>
      {wallet.balance_xof > 0 ? (
        // A new balance starts a fresh form, prefilled with it.
        <WithdrawForm key={wallet.balance_xof} balance={wallet.balance_xof} onDone={onDone} />
      ) : (
        <p className="text-[15px] leading-snug text-ink-muted">Rien à retirer pour l&apos;instant.</p>
      )}
    </div>
  );
}

function ProfileLink({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/testeur/profil"
      className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent"
    >
      {children}
      <ArrowIcon size={18} className="transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

function History({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className={h2Cls}>{title}</h2>
      {children.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line p-5 text-[15px] leading-snug text-ink-muted">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-card)] border border-line">
          {children}
        </ul>
      )}
    </section>
  );
}

function EarningRow({ earning }: { earning: Earning }) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[16px] font-medium text-ink [overflow-wrap:anywhere]">{earning.project_name}</span>
        <span className="text-[13px] text-ink-muted">{formatDateTime(earning.created_at)}</span>
      </div>
      <span className="shrink-0 font-mono text-[15px] font-medium text-accent">+{formatXof(earning.amount_xof)}</span>
    </li>
  );
}

function WithdrawalRow({ withdrawal }: { withdrawal: Withdrawal }) {
  const status = WITHDRAWAL_STATUS[withdrawal.status];
  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[15px] font-medium text-ink">{formatXof(withdrawal.amount_xof)}</span>
        <span className="text-[13px] text-ink-muted">
          {formatDateTime(withdrawal.created_at)} · {withdrawal.momo_number_masked}
        </span>
      </div>
      <div className="self-start md:self-center">
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>
    </li>
  );
}
