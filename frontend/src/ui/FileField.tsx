"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Field } from "@/ui/Field";

// A file input that shows the chosen file name, and a preview when it is an image.
export function FileField({
  label,
  name,
  accept,
  error,
  hint,
}: {
  label: string;
  name: string;
  accept: string;
  error?: string;
  hint?: ReactNode;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Free the previous preview when it changes or the field goes away.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function choose(chosen: File | null) {
    setFile(chosen);
    setPreview(chosen && chosen.type.startsWith("image/") ? URL.createObjectURL(chosen) : null);
  }

  return (
    <Field label={label} error={error} hint={hint}>
      {(control) => (
        <div className="flex flex-col gap-3">
          {/* The real input covers the box, invisible: the browser's own button text would not be in French. */}
          <div
            className={`relative flex min-h-14 items-center gap-4 rounded-[var(--radius-label)] border border-dashed ${error ? "border-danger" : "border-line"} bg-surface-2 px-3 py-2 transition-colors duration-150 focus-within:border-accent hover:border-ink/40`}
          >
            <span
              aria-hidden="true"
              className="inline-flex min-h-10 shrink-0 items-center rounded-pill bg-ink/10 px-4 text-[14px] font-medium text-ink"
            >
              Choisir un fichier
            </span>
            <span aria-hidden="true" className="min-w-0 truncate text-[15px] text-ink-muted">
              {file ? file.name : "Aucun fichier choisi"}
            </span>
            <input
              {...control}
              type="file"
              name={name}
              accept={accept}
              onChange={(e) => choose(e.target.files?.[0] ?? null)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
            <img
              src={preview}
              alt="Aperçu du fichier choisi"
              className="size-24 rounded-[var(--radius-label)] object-cover"
            />
          )}
        </div>
      )}
    </Field>
  );
}
