import { PRODUCT_NAME } from "@/lib/brand";

// Same classes as reveal.tsx (client constants).
const containerCls = "mx-auto w-full max-w-[calc(var(--grid-max)+2*var(--grid-margin))] px-[var(--grid-margin)]";
const kickerCls =
  "font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted";

export function Purpose() {
  return (
    <section id="ce-que-fait" aria-labelledby="purpose-title" className="border-y border-line py-12 md:py-16">
      <div className={`${containerCls} md:grid md:grid-cols-12 md:gap-x-[var(--grid-gutter)]`}>
        <h2 id="purpose-title" className={`${kickerCls} md:col-span-4 md:pt-1.5`}>
          Ce que fait {PRODUCT_NAME}
        </h2>
        <div className="mt-4 max-w-[62ch] space-y-3 text-[17px] leading-[1.6] text-ink-muted md:col-span-8 md:mt-0 md:text-[19px]">
          <p className="text-ink">
            {PRODUCT_NAME} met en relation des développeurs qui ont une application à faire tester avec des
            professionnels vérifiés du métier visé par cette application.
          </p>
          <p>
            Le développeur dépose son application et un parcours de test. Le testeur prouve son métier, suit le
            parcours, envoie ses réponses et son avis, puis il est rémunéré après validation.
          </p>
          <p>La connexion avec Google sert uniquement à t&apos;identifier sur {PRODUCT_NAME}.</p>
        </div>
      </div>
    </section>
  );
}
