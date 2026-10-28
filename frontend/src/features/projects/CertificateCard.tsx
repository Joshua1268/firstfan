import Link from "next/link";
import { formatDateTime } from "@/lib/dates";
import { DownloadIcon, PrinterIcon, ShieldIcon } from "@/ui/icons";
import { certificateUrl } from "./api";
import type { ProjectDetail } from "./types";

const actionCls =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-ink/70 px-5 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.07]";

export function CertificateCard({ project }: { project: ProjectDetail }) {
  const captures = project.captures.length;
  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <ShieldIcon size={26} className="shrink-0 text-accent" />
        <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
          Certificat d&apos;antériorité
        </h2>
      </div>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-ink-muted">
        Horodaté le <span className="text-ink">{formatDateTime(project.fingerprinted_at)}</span>. L&apos;empreinte
        SHA-256 résume le nom, le lien, la description
        {captures > 0 ? ` et ${captures === 1 ? "la capture" : `les ${captures} captures`}` : ""} : la moindre
        modification donnerait une autre empreinte.
      </p>
      <div className="rounded-[var(--radius-label)] border border-line bg-bg-deep px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-kicker)] text-ink-muted">
          Empreinte SHA-256
        </p>
        <p data-testid="fingerprint" className="mt-1.5 break-all font-mono text-[14px] leading-[1.7] text-accent">
          {project.fingerprint}
        </p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <a href={certificateUrl(project.id)} download className={actionCls}>
          <DownloadIcon size={18} />
          Télécharger
        </a>
        <Link href={`/dev/projets/${project.id}/certificat`} className={actionCls}>
          <PrinterIcon size={18} />
          Version imprimable
        </Link>
      </div>
    </section>
  );
}
