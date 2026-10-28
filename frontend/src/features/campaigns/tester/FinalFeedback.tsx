"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Stars } from "@/ui/Stars";
import { submitTest } from "../api";
import type { WouldPay } from "../types";
import { WouldPayChoice } from "./WouldPayChoice";

export function FinalFeedback({
  invitationId,
  focusTitle,
  onSent,
  onConflict,
}: {
  invitationId: number;
  focusTitle: boolean;
  onSent: () => void;
  onConflict: () => void;
}) {
  const [usefulness, setUsefulness] = useState<number | null>(null);
  const [wouldPay, setWouldPay] = useState<WouldPay | null>(null);
  const [devScore, setDevScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  // Fields changed since the error was shown: their message no longer applies.
  const [changed, setChanged] = useState<string[]>([]);
  const fieldError = (name: string) => (changed.includes(name) ? undefined : error?.fields[name]?.join(" "));
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useFocusFirstError(formRef, error);

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const missing: Record<string, string[]> = {};
    if (!usefulness) missing.usefulness = ["Choisis une note de 1 à 5."];
    if (!wouldPay) missing.would_pay = ["Choisis une réponse."];
    if (!devScore) missing.dev_score = ["Choisis une note de 1 à 5."];
    if (!usefulness || !wouldPay || !devScore) {
      showError(new ApiError(400, missing));
      return;
    }

    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    setBusy(true);
    setError(undefined);
    try {
      await submitTest(invitationId, {
        usefulness,
        blockers: text("blockers"),
        would_pay: wouldPay,
        comment: text("comment"),
        dev_score: devScore,
        dev_comment: text("dev_comment"),
      });
      // Stays busy: the page reloads and shows the summary.
      onSent();
    } catch (err) {
      const apiError = asApiError(err);
      showError(apiError);
      setBusy(false);
      // The invitation changed elsewhere, in another tab for instance: show where it stands now.
      if (apiError.status === 409) onConflict();
    }
  }

  function showError(apiError: ApiError) {
    setError(apiError);
    setChanged([]);
  }

  function markChanged(e: FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    setChanged((names) => [...names, name]);
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onChange={markChanged}
      noValidate
      className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 md:p-8"
    >
      <div className="flex flex-col gap-2">
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink focus:outline-none"
        >
          Ton avis
        </h2>
        <p className="text-[15px] leading-[1.6] text-ink-muted">
          Toutes les étapes sont faites. Dis au dev ce que tu en penses, avec l&apos;œil de ton métier.
        </p>
      </div>
      <FormAlert message={formMessage(error)} />
      <Stars
        label="Utilité pour ton métier"
        name="usefulness"
        value={usefulness}
        onChange={setUsefulness}
        error={fieldError("usefulness")}
      />
      <Field label="Ce qui t'a bloqué" error={fieldError("blockers")} hint="Facultatif.">
        {(control) => <textarea {...control} name="blockers" rows={3} className={controlCls} />}
      </Field>
      <WouldPayChoice value={wouldPay} onChange={setWouldPay} error={fieldError("would_pay")} />
      <Field label="Ton avis sur l'app" error={fieldError("comment")} hint="Facultatif.">
        {(control) => <textarea {...control} name="comment" rows={3} className={controlCls} />}
      </Field>
      <div className="flex flex-col gap-6 border-t border-line pt-6">
        <Stars
          label="Ta note pour le dev"
          name="dev_score"
          value={devScore}
          onChange={setDevScore}
          error={fieldError("dev_score")}
        />
        <Field label="Un mot pour le dev" error={fieldError("dev_comment")} hint="Facultatif.">
          {(control) => <textarea {...control} name="dev_comment" rows={2} className={controlCls} />}
        </Field>
      </div>
      <Button type="submit" busy={busy} className="self-stretch md:self-start">
        Envoyer mon test
      </Button>
    </form>
  );
}
