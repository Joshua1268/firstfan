"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { Button } from "@/ui/Button";
import { PrinterIcon } from "@/ui/icons";
import { LoadFailed } from "@/ui/LoadFailed";
import { Loading } from "@/ui/Loading";
import { NotFoundNotice } from "@/ui/NotFoundNotice";
import { getCertificate } from "./api";

// Same text as the downloaded file, laid out for paper: dark ink on white, no space header when printed.
export function CertificatePrint({ projectId }: { projectId: number }) {
  const { data: text, error, reload } = useApi(() => getCertificate(projectId));
  if (error?.status === 404) {
    return <NotFoundNotice message="Projet introuvable." backHref="/dev" backLabel="Retour à tes projets" />;
  }
  if (error) return <LoadFailed message={error.detail ?? "Impossible de charger le certificat."} onRetry={reload} />;
  if (text === undefined) return <Loading label="Chargement du certificat..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center print:hidden">
        <Button type="button" onClick={() => window.print()}>
          <PrinterIcon size={20} />
          Imprimer
        </Button>
        <Link
          href={`/dev/projets/${projectId}`}
          className="inline-flex min-h-11 items-center justify-center text-[15px] text-ink-muted hover:text-ink"
        >
          Retour au projet
        </Link>
      </div>
      <article className="rounded-[var(--radius-card)] bg-[#fbfaf7] p-6 text-[#111] md:p-12 print:rounded-none print:p-0">
        <pre className="whitespace-pre-wrap font-mono [overflow-wrap:anywhere] text-[13px] leading-[1.8] md:text-[14px]">
          {text}
        </pre>
      </article>
    </div>
  );
}
