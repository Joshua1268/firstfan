"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { formatXof } from "@/lib/money";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { FormAlert } from "@/ui/FormAlert";
import { ShieldIcon } from "@/ui/icons";
import { acceptInvitation, declineInvitation } from "../api";
import type { TesterInvitationDetail } from "../types";

const NDA_MISSING = "Coche l'engagement de confidentialité pour commencer.";

// The steps stay hidden until the tester accepts: only their number is shown here.
export function NdaStep({ invitation, onDone }: { invitation: TesterInvitationDetail; onDone: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const ndaError = error?.fields.nda?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      onDone();
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  function accept(e: FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError(new ApiError(400, { nda: [NDA_MISSING] }));
      return;
    }
    run(() => acceptInvitation(invitation.id));
  }

  function decline() {
    if (window.confirm("Refuser cette invitation ? Tu ne pourras plus faire ce test.")) {
      run(() => declineInvitation(invitation.id));
    }
  }

  return (
    <form ref={formRef} onSubmit={accept} noValidate className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8">
        <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
          L&apos;app à tester
        </h2>
        <p className="text-[16px] leading-[1.6] text-ink-muted [overflow-wrap:anywhere]">
          {invitation.project_description}
        </p>
        <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4 text-[15px]">
          <div className="flex flex-col gap-1">
            <dt className="text-ink-muted">Parcours</dt>
            <dd className="text-ink">
              {invitation.steps_total} étape{invitation.steps_total > 1 ? "s" : ""}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-ink-muted">Rémunération</dt>
            <dd className="font-display text-[24px] font-extrabold leading-none text-accent">
              {formatXof(invitation.reward_xof)}
            </dd>
          </div>
        </dl>
      </section>

      <FormAlert message={formMessage(error)} />
      <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line p-5">
        <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
          <ShieldIcon size={20} className="text-accent" />
          Confidentialité
        </p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] leading-snug text-ink">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={ndaError ? true : undefined}
            aria-describedby={ndaError ? "nda-error" : undefined}
            className="size-6 shrink-0 accent-[var(--accent)]"
          />
          Je m&apos;engage à ne pas divulguer l&apos;app ni son contenu
        </label>
        {ndaError && (
          <p id="nda-error" className="text-[14px] leading-snug text-danger">
            {ndaError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Button type="submit" busy={busy}>
          Accepter et commencer
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={decline}>
          Refuser
        </Button>
      </div>
    </form>
  );
}
