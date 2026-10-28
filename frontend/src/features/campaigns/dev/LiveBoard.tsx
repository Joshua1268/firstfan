"use client";

import { useApi } from "@/lib/use-api";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { getLive } from "../api";
import type { CampaignDetail } from "../types";
import { TesterCard } from "./TesterCard";

const REFRESH_MS = 5000;

export function LiveBoard({ campaign }: { campaign: CampaignDetail }) {
  const { data: rows, error, reload } = useApi(() => getLive(campaign.id), { refreshMs: REFRESH_MS });
  const toReview = rows?.filter((row) => row.status === "submitted").length ?? 0;

  return (
    <section aria-labelledby="live-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2
            id="live-title"
            className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink"
          >
            Suivi en direct
          </h2>
          <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-accent">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent motion-safe:animate-pulse" />
            Mis à jour toutes les 5 s
          </span>
        </div>
        <p aria-live="polite" className="max-w-[60ch] text-[15px] text-ink-muted">
          {toReview > 0
            ? `${toReview} test${toReview > 1 ? "s" : ""} à valider.`
            : "Les preuves de chaque étape s'affichent ici dès que le testeur les envoie."}
        </p>
      </div>

      {error && !rows ? (
        <LoadFailed message={error.detail ?? "Impossible de charger le suivi."} onRetry={reload} />
      ) : !rows ? (
        <Loading label="Chargement du suivi..." />
      ) : (
        <>
          {/* A failed refresh keeps the last known state on screen. */}
          {error && (
            <p role="status" className="text-[14px] text-danger">
              Connexion perdue : nouvel essai dans quelques secondes.
            </p>
          )}
          {rows.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-dashed border-line px-5 py-6 text-[15px] text-ink-muted">
              Aucune invitation pour cette campagne.
            </p>
          ) : (
            <ul aria-label="Testeurs" className="flex flex-col gap-4">
              {rows.map((row) => (
                <li key={row.invitation_id}>
                  <TesterCard row={row} steps={campaign.steps} onChanged={reload} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
