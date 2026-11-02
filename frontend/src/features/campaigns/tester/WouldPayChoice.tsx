import { useId } from "react";
import { WOULD_PAY_LABEL } from "../status";
import type { WouldPay } from "../types";

const CHOICES: WouldPay[] = ["yes", "maybe", "no"];

export function WouldPayChoice({
  value,
  onChange,
  error,
}: {
  value: WouldPay | null;
  onChange: (value: WouldPay) => void;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="mb-2 text-[14px] font-medium text-ink">
        Est-ce que tu paierais pour cette app ?
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="grid grid-cols-3 gap-2"
      >
        {CHOICES.map((choice) => (
          <label
            key={choice}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-pill border border-line px-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink/40 has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
          >
            <input
              type="radio"
              name="would_pay"
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
              className="sr-only"
            />
            {WOULD_PAY_LABEL[choice]}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-[14px] leading-snug text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
