"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Field } from "@/ui/Field";

// A file input that shows the chosen file names, and a preview of each image.
export function FileField({
  label,
  name,
  accept,
  multiple = false,
  error,
  hint,
}: {
  label: string;
  name: string;
  accept: string;
  multiple?: boolean;
  error?: string;
  hint?: ReactNode;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Free the previous previews when they change or the field goes away.
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function choose(chosen: File[]) {
    setFiles(chosen);
    setPreviews(chosen.filter((f) => f.type.startsWith("image/")).map((f) => URL.createObjectURL(f)));
  }

  const summary =
    files.length === 0
      ? "Aucun fichier choisi"
      : files.length === 1
        ? files[0].name
        : `${files.length} fichiers choisis`;

  return (
    <Field label={label} error={error} hint={hint}>
      {(control) => (
        <div className="flex flex-col gap-3">
          {/* Invisible input over the box: the native button text is not French. */}
          <div
            className={`relative flex min-h-14 items-center gap-4 rounded-[var(--radius-label)] border border-dashed ${error ? "border-danger" : "border-line"} bg-surface-2 px-3 py-2 transition-colors duration-150 focus-within:border-accent hover:border-ink/40`}
          >
            <span
              aria-hidden="true"
              className="inline-flex min-h-10 shrink-0 items-center rounded-pill bg-ink/10 px-4 text-[14px] font-medium text-ink"
            >
              {multiple ? "Choisir des fichiers" : "Choisir un fichier"}
            </span>
            <span aria-hidden="true" className="min-w-0 truncate text-[15px] text-ink-muted">
              {summary}
            </span>
            <input
              {...control}
              type="file"
              name={name}
              accept={accept}
              multiple={multiple}
              onChange={(e) => choose(Array.from(e.target.files ?? []))}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
                <img
                  key={url}
                  src={url}
                  alt={previews.length === 1 ? "Aperçu du fichier choisi" : `Aperçu ${i + 1}`}
                  className="size-24 rounded-[var(--radius-label)] object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
