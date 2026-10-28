import { useId, type ReactNode } from "react";

export const controlCls =
  "block min-h-12 w-full rounded-[var(--radius-label)] border border-line bg-surface px-4 py-3 text-[16px] text-ink placeholder:text-ghost transition-colors duration-150 hover:border-ink/40 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

export type ControlProps = { id: string; "aria-describedby"?: string; "aria-invalid"?: true };

// children receives the props that tie the control to its label, hint and error.
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: (control: ControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && (
        <p id={errorId} className="text-[14px] leading-snug text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-[13px] leading-snug text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
