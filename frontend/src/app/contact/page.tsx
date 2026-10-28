import type { Metadata } from "next";
import { Actions, PageShell, PrimaryLink, SecondaryLink } from "@/components/site/PageShell";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Contact · ${PRODUCT_NAME}` };

function contactEmail() {
  const v = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

export default function Contact() {
  const email = contactEmail();
  return (
    <PageShell
      kicker="Contact"
      title="Écris-nous."
      lead={`Une question sur ${PRODUCT_NAME}, une app à faire tester, un métier à proposer : on lit tout et on répond.`}
    >
      <div className="hero-lift-12 mt-10 max-w-[60ch] rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:mt-12 md:p-8">
        <p className="font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted">
          Par e-mail
        </p>
        {email ? (
          <p className="mt-3 break-all font-mono text-[18px] leading-snug text-ink md:text-[20px]">{email}</p>
        ) : (
          <>
            <p data-contact-placeholder="" className="mt-3 font-mono text-[18px] leading-snug text-ink md:text-[20px]">
              contact@[domaine]
            </p>
            <p className="mt-2 text-[14px] leading-snug text-ink-muted">
              Adresse à venir : le domaine de {PRODUCT_NAME} n&apos;est pas encore choisi.
            </p>
          </>
        )}
      </div>
      <Actions>
        {email ? (
          <PrimaryLink href={`mailto:${email}`}>Écrire un e-mail</PrimaryLink>
        ) : (
          <PrimaryLink href="/">Retour à l&apos;accueil</PrimaryLink>
        )}
        <SecondaryLink href="/confidentialite">Tes données</SecondaryLink>
      </Actions>
    </PageShell>
  );
}
