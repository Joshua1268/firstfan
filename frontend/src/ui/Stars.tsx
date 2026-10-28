import { useId } from "react";
import { StarIcon } from "@/ui/icons";

const SCORES = [1, 2, 3, 4, 5];

// Five native radio buttons drawn as stars: arrow keys move between them, as in any radio group.
export function Stars({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  error?: string;
}) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-2">
      <span id={`${name}-label`} className="mb-2 text-[14px] font-medium text-ink">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="flex gap-1"
      >
        {SCORES.map((score) => {
          const lit = value !== null && score <= value;
          return (
            <label
              key={score}
              className="flex size-11 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent active:scale-95"
            >
              <input
                type="radio"
                name={name}
                value={score}
                checked={value === score}
                onChange={() => onChange(score)}
                className="sr-only"
              />
              <StarIcon
                size={30}
                fill={lit ? "currentColor" : "none"}
                className={lit ? "text-accent" : "text-ink-muted"}
              />
              <span className="sr-only">{score} sur 5</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="text-[14px] leading-snug text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
