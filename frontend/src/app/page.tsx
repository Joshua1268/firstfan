import { DevExchange } from "@/components/landing/DevExchange";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { JobsMarquee } from "@/components/landing/JobsMarquee";
import { LiveSection } from "@/components/landing/LiveSection";
import { MobileCtaBar } from "@/components/landing/MobileCtaBar";
import { Nav } from "@/components/landing/Nav";
import { ProSection } from "@/components/landing/ProSection";
import { REVEAL_NO_JS } from "@/components/landing/reveal-nojs";
import { Stage } from "@/components/landing/stage/Stage";
import { Trust } from "@/components/landing/Trust";
import { WhatIs } from "@/components/landing/WhatIs";
import { fetchPublicStats } from "@/lib/stats";

export default async function Home() {
  const stats = await fetchPublicStats();
  return (
    <>
      <noscript dangerouslySetInnerHTML={{ __html: REVEAL_NO_JS }} />
      <Nav />
      <main>
        <Hero stats={stats} />
        <JobsMarquee />
        <Stage />
        <ProSection />
        <LiveSection stats={stats} />
        <WhatIs />
        <Trust />
        <DevExchange />
        <FinalCta />
      </main>
      <Footer />
      <MobileCtaBar />
    </>
  );
}
