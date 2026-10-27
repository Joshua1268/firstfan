import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { JobsMarquee } from "@/components/landing/JobsMarquee";
import { MobileCtaBar } from "@/components/landing/MobileCtaBar";
import { Nav } from "@/components/landing/Nav";
import { REVEAL_NO_JS } from "@/components/landing/reveal-nojs";
import { APPLY_HREF, APPLY_LABEL } from "@/components/testeurs/apply";
import { TestersHero } from "@/components/testeurs/TestersHero";
import { Apply, Flexibility, Payment, TrustBlock, WhyYou } from "@/components/testeurs/TestersSections";
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
