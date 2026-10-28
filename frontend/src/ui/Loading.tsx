export function Loading({ label }: { label: string }) {
  return (
    <p role="status" className="text-[15px] text-ink-muted">
      {label}
    </p>
  );
}
