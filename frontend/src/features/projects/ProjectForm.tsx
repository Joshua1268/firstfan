"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FileField } from "@/ui/FileField";
import { FormAlert } from "@/ui/FormAlert";
import { createProject } from "./api";

const MAX_CAPTURES = 3;

// Fields keep their own value; the form element gives them all to FormData on submit.
export function ProjectForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const fieldError = (name: string) => error?.fields[name]?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // With no file chosen, the browser still sends one empty file.
    const captures = form.getAll("captures").filter((f) => f instanceof File && f.size > 0);
    form.delete("captures");
    captures.forEach((f) => form.append("captures", f));
    if (captures.length > MAX_CAPTURES) {
      setError(new ApiError(400, { captures: [`${MAX_CAPTURES} captures au maximum.`] }));
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      const project = await createProject(form);
      router.push(`/dev/projets/${project.id}`);
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert message={formMessage(error)} />
      <Field label="Nom de l'app" error={fieldError("name")}>
        {(control) => <input {...control} name="name" required maxLength={120} className={controlCls} />}
      </Field>
      <Field label="Lien de l'app" error={fieldError("url")} hint="L'adresse où tes testeurs ouvriront l'app.">
        {(control) => (
          <input
            {...control}
            type="url"
            name="url"
            inputMode="url"
            placeholder="https://"
            required
            className={controlCls}
          />
        )}
      </Field>
      <Field
        label="Description"
        error={fieldError("description")}
        hint="Ce que fait l'app et pour qui. Ce texte entre dans l'empreinte du certificat."
      >
        {(control) => <textarea {...control} name="description" required rows={5} className={controlCls} />}
      </Field>
      <FileField
        label="Captures d'écran"
        name="captures"
        accept="image/png,image/jpeg,image/webp"
        multiple
        error={fieldError("captures")}
        hint="Facultatif. Jusqu'à 3 images (PNG, JPEG ou WebP, 5 Mo chacune), ajoutées à l'empreinte."
      />
      <Button type="submit" busy={busy} className="self-stretch md:self-start">
        Déposer mon app
      </Button>
    </form>
  );
}
