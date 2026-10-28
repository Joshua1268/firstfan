"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/dates";
import { CheckIcon, CopyIcon } from "@/ui/icons";
import { StatusPill } from "@/ui/StatusPill";
import type { ProjectDetail } from "./types";

export function ScriptCard({ project }: { project: ProjectDetail }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(project.script_snippet);
      setCopied(true);
    } catch {
      // Clipboard refused (insecure page, permission): the snippet stays selectable by hand.
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
          Script de suivi
        </h2>
        {project.script_seen_at ? (
          <StatusPill tone="success">Détecté le {formatDateTime(project.script_seen_at)}</StatusPill>
        ) : (
          <StatusPill tone="waiting">Pas encore détecté</StatusPill>
        )}
      </div>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-ink-muted">
        Colle cette ligne dans le <code className="font-mono text-ink">&lt;head&gt;</code> de ton app : tu sauras quels
        testeurs y reviennent après leur test.
      </p>
      <pre className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[var(--radius-label)] border border-line bg-bg-deep px-4 py-3 font-mono text-[13px] leading-[1.6] text-ink">
        <code>{project.script_snippet}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-stretch rounded-pill border border-ink/70 px-5 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.07] md:self-start"
      >
        {copied ? <CheckIcon size={18} className="text-accent" /> : <CopyIcon size={18} />}
        {copied ? "Copié" : "Copier"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Script copié dans le presse-papiers" : ""}
      </span>
    </section>
  );
}
