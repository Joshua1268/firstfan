"use client";

import { useApi } from "@/lib/use-api";
import { CheckIcon, CloseIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { StatusPill } from "@/ui/StatusPill";
import { getAdoption } from "./api";
import { WINDOWS, windowSummary } from "./summary";
import type { Returned } from "./types";

const h2Cls = "text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink";

function ReturnCell({ value }: { value: Returned }) {
  if (value === null) return <span className="text-[14px] text-ink-muted">Trop tôt</span>;
  return value ? (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent">
      <CheckIcon size={18} />
      Oui
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[14px] text-ink-muted">
      <CloseIcon size={18} />
      Non
    </span>
  );
}

export function AdoptionTable({ projectId }: { projectId: number }) {
  const { data, error, reload } = useApi(() => getAdoption(projectId));

  return (
    <section aria-labelledby="adoption-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="adoption-title" className={h2Cls}>
          Adoption
        </h2>
        {data?.demo && <StatusPill tone="waiting">Données de démo</StatusPill>}
      </div>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-ink-muted">
        Tes testeurs reviennent-ils sur ton app 1, 7 et 30 jours après leur test ? Le script de suivi le mesure pour
        toi.
      </p>

      {error ? (
        <LoadFailed message={error.detail ?? "Impossible de charger l'adoption."} onRetry={reload} />
      ) : !data ? (
        <Loading label="Chargement de l'adoption..." />
      ) : data.rows.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line px-5 py-6 text-[15px] text-ink-muted">
          Aucun retour mesuré pour l&apos;instant.
        </p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-ink">
            {WINDOWS.map((period) => (
              <li key={period.key}>{windowSummary(data.rows, period)}</li>
            ))}
          </ul>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface/60">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Retour de chaque testeur après son test</caption>
              <thead>
                <tr className="border-b border-line font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-normal md:px-6">
                    Testeur
                  </th>
                  {WINDOWS.map((period) => (
                    <th key={period.key} scope="col" className="px-3 py-3 font-normal md:px-6">
                      {period.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.invitation_id} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-normal md:px-6">
                      <span className="block text-[15px] font-semibold text-ink">{row.tester_first_name}</span>
                      <span className="block text-[13px] text-ink-muted">{row.profession}</span>
                    </th>
                    {WINDOWS.map((period) => (
                      <td key={period.key} className="px-3 py-3 md:px-6">
                        <ReturnCell value={row[period.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
