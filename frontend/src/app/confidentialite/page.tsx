import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageShell } from "@/components/site/PageShell";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Confidentialité · ${PRODUCT_NAME}` };

const linkCls =
  "text-ink underline decoration-line underline-offset-4 transition-colors duration-150 hover:decoration-ink";

export default function Confidentialite() {
  return (
    <PageShell
      kicker="Version provisoire"
      title="Tes données, en clair."
      lead={`Les inscriptions ne sont pas encore ouvertes : ${PRODUCT_NAME} ne collecte aujourd'hui aucune donnée personnelle. Cette page résume ce qui sera demandé à l'ouverture, et pourquoi.`}
    >
      <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-[var(--grid-gutter)]">
        <Card title="Ce qui sera collecté">
          <p>Les informations de ton compte : nom, adresse e-mail, numéro de téléphone.</p>
          <p>
            Pour les testeurs : une preuve de ton métier (document professionnel), ton CV ou ton profil LinkedIn, et le
            numéro mobile money qui sert à te rémunérer.
          </p>
          <p>Pendant un test : les preuves que tu fournis (captures, réponses au parcours guidé).</p>
        </Card>
        <Card title="Pourquoi">
          <p>Vérifier ton métier avant de te proposer des tests, et l&apos;afficher sous forme de badge vérifié.</p>
          <p>Valider un test, puis te rémunérer. Côté dev : savoir qui utilise encore l&apos;app à J7 et à J30.</p>
          <p>Rien n&apos;est revendu, rien ne sert à de la publicité.</p>
        </Card>
        <Card title="Comment">
          <p>Le strict nécessaire : on ne demande que ce qui sert à vérifier, à tester ou à payer.</p>
          <p>
            Les documents de preuve ne sont jamais publics. Seule l&apos;équipe de vérification y a accès, et ils ne
            sont gardés que le temps utile.
          </p>
        </Card>
        <Card title="Ton consentement">
          <p>Chaque envoi de document se fait avec ton accord explicite, au moment où tu l&apos;envoies.</p>
          <p>Tu pourras demander à consulter, corriger ou supprimer tes données.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-[var(--grid-gutter)]">
        <Card title="Déclaration ARTCI">
          <p>
            Une déclaration auprès de l&apos;ARTCI, l&apos;autorité ivoirienne chargée de la protection des données
            personnelles, est prévue avant l&apos;ouverture des inscriptions.
          </p>
        </Card>
        <Card title="Une question ?">
          <p>
            Passe par la{" "}
            <Link href="/contact" className={linkCls}>
              page contact
            </Link>
            .
          </p>
        </Card>
      </div>

      <p className="mt-10 max-w-[65ch] text-[14px] leading-snug text-ink-muted">
        Page provisoire, rédigée pendant CADEV 2026. Elle sera complétée et relue avant l&apos;ouverture des
        inscriptions ; elle ne constitue pas encore une politique de confidentialité au sens juridique.
      </p>
    </PageShell>
  );
}
