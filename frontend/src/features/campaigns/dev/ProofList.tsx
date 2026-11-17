"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/dates";
import { Dialog } from "@/ui/Dialog";
import type { LiveStep } from "../live";

export function ProofList({ steps }: { steps: LiveStep[] }) {
  const [enlarged, setEnlarged] = useState<LiveStep | null>(null);

  return (
    <>
      <ol aria-label="Étapes et preuves" className="flex flex-col gap-4">
        {steps.map((step) => (
          <li key={step.order} className="flex gap-4">
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[13px] ${
                step.proof ? "bg-accent text-accent-ink" : "border border-line text-ink-muted"
              }`}
            >
              {step.order}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-[15px] font-medium leading-snug text-ink [overflow-wrap:anywhere]">
                <span className="sr-only">Étape {step.order} : </span>
                {step.instruction}
              </p>
              {step.proof ? (
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setEnlarged(step)}
                    aria-label={`Agrandir la capture de l'étape ${step.order}`}
                    className="shrink-0 overflow-hidden rounded-[var(--radius-label)] border border-line transition-colors duration-150 hover:border-ink/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- private capture served by the API */}
                    <img src={step.proof.capture_url} alt="" className="size-16 object-cover" />
                  </button>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-[15px] leading-[1.5] text-ink [overflow-wrap:anywhere]">
                      {step.proof.answer || <span className="text-ink-muted">Sans commentaire</span>}
                    </p>
                    <p className="font-mono text-[12px] text-ink-muted">{formatDateTime(step.proof.updated_at)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-ink-muted">Pas encore faite</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {enlarged?.proof && (
        <Dialog title={`Capture de l'étape ${enlarged.order}`} onClose={() => setEnlarged(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- private capture served by the API */}
          <img
            src={enlarged.proof.capture_url}
            alt={`Capture envoyée pour : ${enlarged.instruction}`}
            className="max-h-[65dvh] w-full rounded-[var(--radius-label)] border border-line object-contain"
          />
        </Dialog>
      )}
    </>
  );
}
