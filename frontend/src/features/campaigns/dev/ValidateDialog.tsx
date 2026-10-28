"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Stars } from "@/ui/Stars";
import { validateTest } from "../api";
import type { Decision } from "../types";

const DECISIONS: { value: Decision; label: string }[] = [
  { value: "validated", label: "Valider" },
  { value: "rejected", label: "Refuser" },
];

export function ValidateDialog({
  invitationId,
  testerName,
  onClose,
  onDone,
  onStale,
}: {
  invitationId: number;
  testerName: string;
  onClose: () => void;
  onDone: () => void;
  onStale: () => void;
}) {
  const [decision, setDecision] = useState<Decision>("validated");
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!score) {
      setError(new ApiError(400, { score: ["Choisis une note de 1 à 5."] }));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await validateTest(invitationId, { decision, score, comment: comment.trim() });
      // Stays busy: the dialog closes and the board shows the outcome.
      onDone();
    } catch (err) {
      const apiError = asApiError(err);
      setError(apiError);
      setBusy(false);
      // Already judged, in another tab for instance: the board refreshes behind the message.
      if (apiError.status === 409) onStale();
    }
  }

  return (
    <Dialog title={`Valider le test de ${testerName}`} onClose={onClose}>
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
        <FormAlert message={formMessage(error)} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[14px] font-medium text-ink">Ta décision</legend>
          <div className="grid grid-cols-2 gap-2">
            {DECISIONS.map((choice) => (
              <label
                key={choice.value}
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-pill border border-line px-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink/40 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
              >
                <input
                  type="radio"
                  name="decision"
                  value={choice.value}
                  checked={decision === choice.value}
                  onChange={() => setDecision(choice.value)}
                  className="sr-only"
                />
                {choice.label}
              </label>
            ))}
          </div>
          <p className="text-[13px] leading-snug text-ink-muted">
            {decision === "validated"
              ? "Le testeur reçoit sa rémunération dès maintenant."
              : "Le testeur n'est pas rémunéré pour ce test."}
          </p>
        </fieldset>
        <Stars
          label="Ta note pour le testeur"
          name="score"
          value={score}
          onChange={(value) => {
            setScore(value);
            setError(undefined);
          }}
          error={error?.fields.score?.join(" ")}
        />
        <Field label="Un mot pour le testeur" error={error?.fields.comment?.join(" ")} hint="Facultatif.">
          {(control) => (
            <textarea
              {...control}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={controlCls}
            />
          )}
        </Field>
        <Button type="submit" busy={busy} className="self-stretch md:self-start">
          {decision === "validated" ? "Valider le test" : "Refuser le test"}
        </Button>
      </form>
    </Dialog>
  );
}
