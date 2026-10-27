import { CheckIcon, StarIcon } from "./icons";

/**
 * Autocollant statique (sections basses, §3.5 et §3.10) : même vocabulaire que ceux du hero,
 * sans parallaxe. Décoratif : son info est reprise en texte dans la section.
 * L'ombre est un calque figé (`sticker-shadow`), jamais animée.
 */
export type ProofKind = "pill" | "check" | "rating" | "tag" | "ticket";

const base =
  "font-sans text-[length:var(--text-sticker)] font-semibold leading-[var(--leading-sticker)] whitespace-nowrap";

export function ProofSticker({ text, kind, className = "" }: { text: string; kind: ProofKind; className?: string }) {
  if (kind === "rating") {
    return (
      <span className={`relative inline-flex ${className}`}>
        <span aria-hidden="true" className="sticker-shadow rounded-full" />
        <span
          className={`${base} relative flex size-[76px] flex-col items-center justify-center gap-0.5 rounded-full bg-ink text-bg md:size-[88px]`}
        >
          <StarIcon size={16} fill="currentColor" />
          <span className="tabular-nums">{text}</span>
        </span>
      </span>
    );
  }
  const shape =
    kind === "check"
      ? "rounded-pill bg-accent text-accent-ink px-4 py-2.5"
      : kind === "tag"
        ? "rounded-label bg-ink text-bg py-2.5 pl-3 pr-4"
        : kind === "ticket"
          ? "sticker-ticket bg-ink text-bg py-3 px-5"
          : "rounded-pill bg-ink text-bg px-4 py-2.5";
  const radius = kind === "tag" || kind === "ticket" ? "rounded-label" : "rounded-pill";
  return (
    <span className={`relative inline-flex ${className}`}>
      <span aria-hidden="true" className={`sticker-shadow ${radius}`} />
      <span className={`${base} ${shape} relative inline-flex items-center gap-1.5`}>
        {kind === "check" && <CheckIcon size={16} strokeWidth={2.25} />}
        {kind === "tag" && <span aria-hidden="true" className="mr-1 size-2.5 rounded-full bg-bg" />}
        <span className="tabular-nums">{text}</span>
      </span>
    </span>
  );
}
