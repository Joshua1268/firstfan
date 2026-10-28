"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FileField } from "@/ui/FileField";
import { FormAlert } from "@/ui/FormAlert";
import { saveStepProof } from "../api";
import type { TestStep } from "../types";

const MAX_CAPTURE_BYTES = 5 * 1024 * 1024;

export function GuidedStep({
  invitationId,
  step,
  number,
  total,
  focusTitle,
  onSaved,
}: {
  invitationId: number;
  step: TestStep;
  number: number;
  total: number;
  focusTitle: boolean;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const fieldError = (name: string) => error?.fields[name]?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useFocusFirstError(formRef, error);

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // With no file chosen, the browser still sends one empty file.
    const capture = form.get("capture");
    if (capture instanceof File && capture.size === 0) form.delete("capture");
    const missing = checkCapture(form.get("capture"), step.proof !== null);
    if (missing) {
      setError(new ApiError(400, { capture: [missing] }));
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      await saveStepProof(invitationId, step.order, form);
      // Stays busy: the page reloads the invitation and shows the next step.
      onSaved();
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5 md:p-8"
    >
      <div className="flex flex-col gap-3">
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="font-mono text-[12px] uppercase tracking-[var(--tracking-kicker)] text-accent focus:outline-none"
        >
          Étape {number} sur {total}
        </h2>
        <p className="text-[20px] font-semibold leading-[1.4] text-ink [overflow-wrap:anywhere]">{step.instruction}</p>
      </div>
      <FormAlert message={formMessage(error)} />
      <Field label="Ta réponse" error={fieldError("answer")} hint="Facultatif. Ce que tu as vu, ce qui t'a surpris.">
        {(control) => (
          <textarea
            {...control}
            name="answer"
            rows={3}
            maxLength={2000}
            defaultValue={step.proof?.answer}
            className={controlCls}
          />
        )}
      </Field>
      <FileField
        label="Capture d'écran"
        name="capture"
        accept="image/*"
        capture="environment"
        error={fieldError("capture")}
        hint={
          step.proof
            ? "Une capture est déjà enregistrée. Choisis une image seulement pour la remplacer."
            : "Montre l'écran où tu es arrivé : JPEG, PNG ou WebP, 5 Mo maximum."
        }
      />
      {step.proof && (
        <figure className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- private capture served by the API */}
          <img
            src={step.proof.capture_url}
            alt={`Capture enregistrée pour l'étape ${number}`}
            className="h-40 w-auto self-start rounded-[var(--radius-label)] border border-line object-contain"
          />
          <figcaption className="text-[13px] text-ink-muted">Capture enregistrée</figcaption>
        </figure>
      )}
      <Button type="submit" busy={busy} className="self-stretch md:self-start">
        Valider l&apos;étape
      </Button>
    </form>
  );
}

// Same rules as the API, checked here so a heavy photo is not sent for nothing.
function checkCapture(capture: FormDataEntryValue | null, hasProof: boolean): string | null {
  if (!(capture instanceof File)) return hasProof ? null : "Ajoute une capture d'écran.";
  if (capture.size > MAX_CAPTURE_BYTES) return "Fichier trop lourd (5 Mo maximum).";
  return null;
}
