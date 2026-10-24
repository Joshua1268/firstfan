import { Hero } from "@/components/landing/Hero";
import { JobsMarquee } from "@/components/landing/JobsMarquee";
import { MobileCtaBar } from "@/components/landing/MobileCtaBar";
import { Nav } from "@/components/landing/Nav";
import { Stage } from "@/components/landing/stage/Stage";
import { fetchPublicStats } from "@/lib/stats";

// Composition serveur de la landing (§3) : les sections suivantes s'ajoutent sous le hero.
export default async function Home() {
  const stats = await fetchPublicStats();
  return (
    <>
      <Nav />
      <main>
        <Hero stats={stats} />
        <JobsMarquee />
        <Stage />
        {/* Section pro : construite en Task 7 ; ancre minimale pour « Passer l'histoire ». */}
        <section id="pro" aria-label="Côté testeur" className="min-h-[50vh] px-[var(--grid-margin)] py-[var(--section-y)]" />
      </main>
      <MobileCtaBar />
    </>
  );
}
