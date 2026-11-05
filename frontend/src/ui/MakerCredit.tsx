import { MAKER_EMAIL, MAKER_NAME } from "@/lib/brand";

export function MakerCredit({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      Conçu et développé par {MAKER_NAME} ·{" "}
      <a
        href={`mailto:${MAKER_EMAIL}`}
        className="break-all underline decoration-line underline-offset-4 transition-colors duration-150 hover:text-ink"
      >
        {MAKER_EMAIL}
      </a>
    </p>
  );
}
