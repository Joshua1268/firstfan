"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, asApiError, formMessage } from "@/lib/api-client";
import { formatXof } from "@/lib/money";
import { useFocusFirstError } from "@/lib/use-focus-first-error";
import { Button } from "@/ui/Button";
import { Field, controlCls } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { withdraw } from "./api";
import type { Withdrawal } from "./types";
import { parseAmount } from "./format";

export function WithdrawForm({ balance, onDone }: { balance: number; onDone: (withdrawal: Withdrawal) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState(String(balance));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  useFocusFirstError(formRef, error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = parseAmount(amount);
    if (value === null || value < 1) {
      setError(new ApiError(400, { amount_xof: ["Indique un montant en FCFA, en chiffres."] }));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      onDone(await withdraw(value));
    } catch (e) {
      setError(asApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        label="Montant à retirer (FCFA)"
        error={error?.fields.amount_xof?.[0]}
        hint={`Tout ton solde par défaut : ${formatXof(balance)}.`}
      >
        {(control) => (
          <input
            {...control}
            name="amount_xof"
            inputMode="numeric"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={controlCls}
          />
        )}
      </Field>
      <FormAlert message={formMessage(error)} />
      <Button type="submit" busy={busy}>
        {busy ? "Envoi en cours..." : "Retirer"}
      </Button>
    </form>
  );
}
