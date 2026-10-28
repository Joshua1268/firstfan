import Link from "next/link";
import { useId } from "react";

export function ConsentCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-[var(--accent)]"
        />
        <label htmlFor={id} className="cursor-pointer text-[15px] leading-snug text-ink">
          J&apos;accepte que mes informations professionnelles soient vérifiées et conservées pour la durée du service.
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="pl-9 text-[14px] leading-snug text-danger">
          {error}
        </p>
      )}
      <Link
        href="/confidentialite"
        className="inline-flex min-h-11 items-center self-start pl-9 text-[14px] text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Lire la politique de confidentialité
      </Link>
    </div>
  );
}
