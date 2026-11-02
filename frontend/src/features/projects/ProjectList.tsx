"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/dates";
import { useApi } from "@/lib/use-api";
import { ArrowIcon, PlusIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { getProjects } from "./api";

export function ProjectList() {
  const { data: projects, error, reload } = useApi(getProjects);
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger tes projets."} onRetry={reload} />;
  if (!projects) return <Loading label="Chargement de tes projets..." />;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dev/projets/nouveau"
        className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill bg-accent px-7 text-[16px] font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-press md:w-auto md:self-start"
      >
        <PlusIcon size={20} />
        Déposer une app
      </Link>

      {projects.length === 0 ? (
        <section className="rounded-[var(--radius-card)] border border-dashed border-line p-6 md:p-8">
          <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
            Aucun projet pour l&apos;instant
          </h2>
          <p className="mt-3 max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">
            Dépose ton app : elle est horodatée tout de suite, puis tu prépares le parcours de tes testeurs.
          </p>
        </section>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dev/projets/${p.id}`}
                className="group flex min-h-24 items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 transition-colors duration-150 hover:border-ink/40"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[18px] font-semibold text-ink">{p.name}</span>
                  <span className="truncate text-[14px] text-ink-muted">{p.url}</span>
                  <span className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
                    Déposée le {formatDateTime(p.created_at)}
                  </span>
                </div>
                <ArrowIcon
                  size={20}
                  className="shrink-0 text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
