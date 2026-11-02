// Error that belongs to no single field (wrong password, network down).
export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[var(--radius-label)] border border-danger/50 px-4 py-3 text-[15px] text-danger">
      {message}
    </p>
  );
}
