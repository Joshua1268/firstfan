"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/ui/icons";

// Render it only while open. The native modal <dialog> keeps Tab inside it, closes on Escape
// and hides the rest of the page from screen readers; on close the focus goes back where it was.
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // The close event comes later: skip it when the dialog was opened again meanwhile (React dev remounts).
    const close = () => !dialog.open && onCloseRef.current();
    dialog.addEventListener("close", close);
    dialog.showModal();
    return () => {
      dialog.removeEventListener("close", close);
      dialog.close();
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      // A click on the dimmed backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-[560px] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-5 p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="pt-2 text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] [overflow-wrap:anywhere]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line text-ink-muted transition-colors duration-150 hover:border-ink/60 hover:text-ink"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
