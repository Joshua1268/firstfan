import { SpaceTitle } from "@/ui/AppShell";
export default function DevHome() {
  return (
    <div className="flex flex-col gap-10">
      <SpaceTitle>Tes projets</SpaceTitle>
      <section className="rounded-[var(--radius-card)] border border-dashed border-line p-6 md:p-8">
        <h2 className="text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
          Aucun projet pour l&apos;instant
        </h2>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-[1.6] text-ink-muted">
          Ici apparaîtront les apps que tu déposes, leurs campagnes de test et les retours des testeurs.
        </p>
      </section>
    </div>
  );
}
