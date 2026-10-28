"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { login } from "./api";
import { homeFor } from "./redirect";

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const me = await login(email, password);
      router.replace(homeFor(me, next));
    } catch (err) {
      setError(asApiError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormAlert message={formMessage(error)} />
      <Field label="Email" error={error?.fields.email?.[0]}>
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
      <Field label="Mot de passe" error={error?.fields.password?.[0]}>
        {(control) => (
          <input
            {...control}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={controlCls}
          />
        )}
      </Field>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <Button type="submit" busy={busy}>
          Se connecter
        </Button>
        <Link
          href="/inscription"
          className="inline-flex min-h-11 items-center justify-center text-[15px] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Pas encore de compte ? Inscris-toi
        </Link>
      </div>
    </form>
  );
}
