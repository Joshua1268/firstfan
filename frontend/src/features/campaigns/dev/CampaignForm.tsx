"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { getProfessions } from "@/features/accounts/api";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { useApi } from "@/lib/use-api";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { createCampaign } from "../api";
import { OPEN_TO_ALL } from "../audience";
import { MAX_STEP_LENGTH, canSubmit } from "../steps";
import { StepsEditor } from "./StepsEditor";

export function CampaignForm({ projectId }: { projectId: number }) {
  const router = useRouter();
  const { data: professions, error: professionsError, reload: reloadProfessions } = useApi(getProfessions);
  const [profession, setProfession] = useState("");
  const [testers, setTesters] = useState("3");
  const [steps, setSteps] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const fieldError = (name: string) => error?.fields[name]?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const missing = checkFields(profession, testers, steps);
    if (Object.keys(missing).length > 0) {
      setError(new ApiError(400, missing));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const campaign = await createCampaign(projectId, {
        target_profession: profession === OPEN_TO_ALL ? "" : profession,
        testers_wanted: Number(testers),
        steps: steps.map((s) => s.trim()),
      });
      router.push(`/dev/campagnes/${campaign.id}`);
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert message={formMessage(error)} />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px]">
        <Field
          label="Métier ciblé"
          error={fieldError("target_profession")}
          hint={professionsError ? <ProfessionsFailed onRetry={reloadProfessions} /> : audienceHint(profession)}
        >
          {(control) => (
            <select
              {...control}
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              required
              className={controlCls}
            >
              <option value="" disabled>
                {professions
                  ? "Choisis un métier"
                  : professionsError
                    ? "Métiers indisponibles"
                    : "Chargement des métiers..."}
              </option>
              {professions && <option value={OPEN_TO_ALL}>{OPEN_TO_ALL} (aucune pièce demandée)</option>}
              {professions?.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Nombre de testeurs" error={fieldError("testers_wanted")} hint="De 1 à 10.">
          {(control) => (
            <input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              required
              value={testers}
              onChange={(e) => setTesters(e.target.value)}
              className={controlCls}
            />
          )}
        </Field>
      </div>
      <StepsEditor steps={steps} onChange={setSteps} error={fieldError("steps")} />
      <Button type="submit" busy={busy} className="self-stretch md:self-start">
        Créer la campagne
      </Button>
    </form>
  );
}

// Same rules as the API, checked here so every empty field shows on the first submit.
function checkFields(profession: string, testers: string, steps: string[]): Record<string, string[]> {
  const missing: Record<string, string[]> = {};
  if (!profession) missing.target_profession = ["Choisis un métier ou « Tout public »."];
  const count = Number(testers);
  if (!Number.isInteger(count) || count < 1 || count > 10) missing.testers_wanted = ["Entre un nombre de 1 à 10."];
  if (!canSubmit(steps)) missing.steps = [`Remplis chaque étape (${MAX_STEP_LENGTH} caractères au plus).`];
  return missing;
}

function audienceHint(profession: string): string {
  if (profession === OPEN_TO_ALL) return "Tout testeur inscrit peut postuler, sans pièce à fournir.";
  return "Seuls des testeurs qui ont prouvé exercer ce métier, avec une pièce vérifiée par l'équipe, seront invités.";
}

function ProfessionsFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      Impossible de charger les métiers.
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4"
      >
        Réessayer
      </button>
    </span>
  );
}
