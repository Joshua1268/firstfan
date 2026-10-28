import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronIcon } from "@/ui/icons";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 max-w-full items-center gap-1.5 self-start text-[15px] text-ink-muted underline decoration-line underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
    >
      <ChevronIcon size={16} className="shrink-0 rotate-90" />
      <span className="truncate">{children}</span>
    </Link>
  );
}
