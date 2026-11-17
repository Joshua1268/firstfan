"use client";

import { useApi } from "@/lib/use-api";
import { SpaceTitle } from "@/ui/AppShell";
import { BackLink } from "@/ui/BackLink";
import { Button } from "@/ui/Button";
import { PrinterIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { NotFoundNotice } from "@/ui/NotFoundNotice";
import { getCertificate } from "./api";

// Dark ink on white, no header when printed.
export function CertificatePrint({ projectId }: { projectId: number }) {
  const { data: text, error, reload } = useApi(() => getCertificate(projectId));
  if (error?.status === 404) {
    return <NotFoundNotice message="Projet introuvable." backHref="/dev" backLabel="Retour à tes projets" />;
  }
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger le certificat."} onRetry={reload} />;
  if (text === undefined) return <Loading label="Chargement du certificat..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 print:hidden">
        <BackLink href={`/dev/projets/${projectId}`}>Retour au projet</BackLink>
        <SpaceTitle>Certificat d&apos;antériorité</SpaceTitle>
        <Button type="button" onClick={() => window.print()} className="md:self-start">
          <PrinterIcon size={20} />
          Imprimer
        </Button>
      </div>
      <article className="rounded-[var(--radius-card)] bg-[#fbfaf7] p-6 text-[#111] md:p-12 print:rounded-none print:p-0">
        <pre className="whitespace-pre-wrap font-mono [overflow-wrap:anywhere] text-[13px] leading-[1.8] md:text-[14px]">
          {text}
        </pre>
      </article>
    </div>
  );
}
