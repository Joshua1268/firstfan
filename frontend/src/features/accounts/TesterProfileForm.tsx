"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { useApi } from "@/lib/use-api";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { LoadFailed } from "@/ui/LoadFailed";
import { getProfessions, getTesterProfile, updateTesterProfile } from "./api";
import { missingProfileFields } from "./profile-check";
import type { TesterProfile } from "./types";

async function loadForm() {
  const [profile, professions] = await Promise.all([getTesterProfile(), getProfessions()]);
  return { profile, professions };
}

export function TesterProfileForm() {
  const { data, error, reload } = useApi(loadForm);
  if (error) {
    return <LoadFailed message={error.detail ?? "Impossible de charger ton profil."} onRetry={reload} />;
  }
  if (!data)
    return (
      <p role="status" className="text-[15px] text-ink-muted">
        Chargement de ton profil...
      </p>
    );
  return <ProfileForm profile={data.profile} professions={data.professions} />;
}

// Fields keep their own value (defaultValue); the form element gives them all to FormData on submit.
function ProfileForm({ profile, professions }: { profile: TesterProfile; professions: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const fieldError = (name: string) => error?.fields[name]?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // An unchecked box is missing from FormData.
    form.set("available", form.has("available") ? "true" : "false");

    const missing = missingProfileFields(form);
    if (Object.keys(missing).length > 0) {
      setError(new ApiError(400, missing));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await updateTesterProfile(form);
      router.push("/testeur");
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert message={formMessage(error)} />
      <Field label="Métier" error={fieldError("profession")}>
        {(control) => (
          <select {...control} name="profession" defaultValue={profile.profession} required className={controlCls}>
            <option value="" disabled>
              Choisis ton métier
            </option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Entreprise ou activité" error={fieldError("company")} hint="Facultatif.">
        {(control) => <input {...control} name="company" defaultValue={profile.company} className={controlCls} />}
      </Field>
      <Field label="Commune" error={fieldError("city")}>
        {(control) => (
          <input
            {...control}
            name="city"
            defaultValue={profile.city}
            autoComplete="address-level2"
            className={controlCls}
          />
        )}
      </Field>
      <Field label="Profil LinkedIn" error={fieldError("linkedin_url")} hint="Facultatif.">
        {(control) => (
          <input
            {...control}
            type="url"
            name="linkedin_url"
            inputMode="url"
            placeholder="https://www.linkedin.com/in/..."
            defaultValue={profile.linkedin_url}
            className={controlCls}
          />
        )}
      </Field>
      <Field label="Numéro mobile money" error={fieldError("momo_number")} hint="Tes gains arrivent sur ce numéro.">
        {(control) => (
          <input
            {...control}
            type="tel"
            name="momo_number"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={profile.momo_number}
            className={controlCls}
          />
        )}
      </Field>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
        <input
          type="checkbox"
          name="available"
          defaultChecked={profile.available}
          className="size-6 shrink-0 accent-[var(--accent)]"
        />
        Je suis disponible pour tester des apps
      </label>
      <Button type="submit" busy={busy} className="self-stretch md:self-start">
        Enregistrer mon profil
      </Button>
    </form>
  );
}
