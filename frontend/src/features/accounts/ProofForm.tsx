"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FileField } from "@/ui/FileField";
import { FormAlert } from "@/ui/FormAlert";
import { LockIcon } from "@/ui/icons";
import type { ChecksOverview } from "./types";

export function ProofForm({
  overview,
  submitLabel,
  onSubmit,
}: {
  overview: ChecksOverview;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const fieldError = (name: string) => error?.fields[name]?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("consent", form.has("consent") ? "true" : "false");
    const missing = missingProofFields(form);
    if (Object.keys(missing).length > 0) {
      setError(new ApiError(400, missing));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert message={formMessage(error)} />
      <Field label={`Pièce qui prouve ton métier : ${overview.profession}`} error={fieldError("document_type")}>
        {(control) => (
          <select {...control} name="document_type" defaultValue="" required className={controlCls}>
            <option value="" disabled>
              Choisis le type de pièce
            </option>
            {overview.documents.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <FileField
        label="Fichier"
        name="document"
        accept="image/*,application/pdf"
        error={fieldError("document")}
        hint="Image ou PDF, 5 Mo maximum. Masque ce qui ne sert pas à la vérification : numéros, montants, adresse."
      />
      <Field
        label="Parrain"
        error={fieldError("sponsor_email")}
        hint="Facultatif. L'email d'un testeur déjà vérifié dans ton métier qui peut confirmer que tu l'exerces."
      >
        {(control) => <input {...control} type="email" name="sponsor_email" inputMode="email" className={controlCls} />}
      </Field>
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-ink">
          <input type="checkbox" name="consent" className="mt-0.5 size-6 shrink-0 accent-[var(--accent)]" />
          J&apos;accepte que l&apos;équipe consulte cette pièce pour vérifier mon métier.
        </label>
        {fieldError("consent") && <p className="pl-9 text-[14px] text-danger">{fieldError("consent")}</p>}
      </div>
      <p className="flex items-start gap-2 text-[14px] leading-[1.5] text-ink-muted">
        <LockIcon size={16} className="mt-0.5 shrink-0" />
        Seule l&apos;équipe voit ta pièce. Elle est supprimée dès la décision : on garde seulement ton métier, le type
        de pièce et la date. La vérification vaut 12 mois.
      </p>
      <Button type="submit" busy={busy} className="self-stretch md:self-start">
        {submitLabel}
      </Button>
    </form>
  );
}

function missingProofFields(form: FormData): Record<string, string[]> {
  const missing: Record<string, string[]> = {};
  if (!form.get("document_type")) missing.document_type = ["Choisis le type de pièce."];
  const file = form.get("document");
  if (!(file instanceof File) || file.size === 0) missing.document = ["Ajoute le fichier de ta pièce."];
  if (form.get("consent") !== "true") missing.consent = ["Ton accord est nécessaire pour envoyer cette pièce."];
  return missing;
}
