import type { Metadata } from "next";
import { Footer } from "@/features/landing/Footer";
import { JobsMarquee } from "@/features/landing/JobsMarquee";
import { MobileCtaBar } from "@/features/landing/MobileCtaBar";
import { Nav } from "@/features/landing/Nav";
import { REVEAL_NO_JS } from "@/features/landing/reveal-nojs";
import { APPLY_HREF, APPLY_LABEL } from "@/features/testers-landing/apply";
import { TestersHero } from "@/features/testers-landing/TestersHero";
import { Apply, Flexibility, Payment, TrustBlock, WhyYou } from "@/features/testers-landing/TestersSections";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Devenir testeur rémunéré · ${PRODUCT_NAME}`,
  description:
    "Comptable, restauratrice, livreur, commerçante : teste depuis ton téléphone des apps faites pour ton métier. Métier vérifié, chaque test rémunéré en mobile money après validation.",
};

export default function Testeurs() {
  return (
    <>
      <noscript dangerouslySetInnerHTML={{ __html: REVEAL_NO_JS }} />
      <Nav page="testeurs" />
      <main>
        <TestersHero />
        <JobsMarquee />
        <WhyYou />
        <Payment />
        <Flexibility />
        <TrustBlock />
        <Apply />
      </main>
      <Footer page="testeurs" />
      <MobileCtaBar href={APPLY_HREF} label={APPLY_LABEL} camp="pro" />
    </>
  );
}
