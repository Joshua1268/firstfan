"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { register } from "./api";
import { homeFor } from "./redirect";
import type { Role } from "./types";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { googleStartUrl } from "./google";
import { GoogleButton } from "./GoogleButton";

export function RegisterForm({ role }: { role: Role }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const fieldError = (name: string) => error?.fields[name]?.join(" ");
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, error);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const me = await register({ email, password, first_name: firstName, role, consent });
      router.replace(homeFor(me));
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6">
        <FormAlert message={formMessage(error)} />
        <Field label="Prénom" error={fieldError("first_name")}>
          {(control) => (
            <input
              {...control}
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={controlCls}
            />
          )}
        </Field>
        <Field label="Email" error={fieldError("email")}>
          {(control) => (
            <input
              {...control}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={controlCls}
            />
          )}
        </Field>
        <Field
          label="Mot de passe"
          error={fieldError("password")}
          hint="8 caractères au moins, pas seulement des chiffres."
        >
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={controlCls}
            />
          )}
        </Field>
        {role === "tester" && <ConsentCheckbox checked={consent} onChange={setConsent} error={fieldError("consent")} />}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <Button type="submit" busy={busy}>
            Créer mon compte
          </Button>
          <Link
            href="/connexion"
            className="inline-flex min-h-11 items-center justify-center text-[15px] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Déjà un compte ? Connecte-toi
          </Link>
        </div>
      </form>
      <GoogleButton
        href={googleStartUrl({ intent: "signup", role, consent })}
        disabledHint={
          role === "tester" && !consent ? "Coche la case de consentement ci-dessus pour continuer avec Google." : null
        }
      />
    </div>
  );
}
