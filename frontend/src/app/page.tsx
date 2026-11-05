import { DevExchange } from "@/features/landing/DevExchange";
import { FinalCta } from "@/features/landing/FinalCta";
import { Footer } from "@/features/landing/Footer";
import { Hero } from "@/features/landing/Hero";
import { JobsMarquee } from "@/features/landing/JobsMarquee";
import { LiveSection } from "@/features/landing/LiveSection";
import { MobileCtaBar } from "@/features/landing/MobileCtaBar";
import { Nav } from "@/features/landing/Nav";
import { ProSection } from "@/features/landing/ProSection";
import { Purpose } from "@/features/landing/Purpose";
import { REVEAL_NO_JS } from "@/features/landing/reveal-nojs";
import { Stage } from "@/features/landing/stage/Stage";
import { Trust } from "@/features/landing/Trust";
import { WhatIs } from "@/features/landing/WhatIs";
import { fetchPublicStats } from "@/lib/stats";

export default async function Home() {
  const stats = await fetchPublicStats();
  return (
    <>
      <noscript dangerouslySetInnerHTML={{ __html: REVEAL_NO_JS }} />
      <Nav />
      <main>
        <Hero stats={stats} />
        <Purpose />
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
