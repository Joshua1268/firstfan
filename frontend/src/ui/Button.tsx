import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-press active:bg-accent-press",
  secondary: "border border-ink/70 text-ink hover:border-ink hover:bg-ink/[0.07]",
};

// While busy the button stays in place but ignores clicks, so a form is never sent twice.
export function Button({
  variant = "primary",
  busy = false,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS; busy?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill px-7 text-[16px] font-semibold leading-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
