"use client";

import type { ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { BackLink } from "@/ui/BackLink";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { NotFoundNotice } from "@/ui/NotFoundNotice";
import { getProject } from "./api";
import { CertificateCard } from "./CertificateCard";
import { ScriptCard } from "./ScriptCard";

// children show once the project is known to exist.
export function ProjectOverview({ projectId, children }: { projectId: number; children: ReactNode }) {
  const { data: project, error, reload } = useApi(() => getProject(projectId));
  if (error?.status === 404) {
    return <NotFoundNotice message="Projet introuvable." backHref="/dev" backLabel="Retour à tes projets" />;
  }
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger ce projet."} onRetry={reload} />;
  if (!project) return <Loading label="Chargement du projet..." />;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <BackLink href="/dev">Tes projets</BackLink>
        <SpaceTitle>{project.name}</SpaceTitle>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 max-w-full items-center self-start text-[16px] text-accent underline-offset-4 hover:underline"
        >
          <span className="truncate">{project.url}</span>
        </a>
        <p className="max-w-[60ch] whitespace-pre-line text-[16px] leading-[1.6] text-ink-muted">
          {project.description}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <CertificateCard project={project} />
        <ScriptCard project={project} />
      </div>
      {children}
    </div>
  );
}
