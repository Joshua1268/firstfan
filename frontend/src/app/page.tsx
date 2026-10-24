import { Hero } from "@/components/landing/Hero";
import { MobileCtaBar } from "@/components/landing/MobileCtaBar";
import { Nav } from "@/components/landing/Nav";
import { fetchPublicStats } from "@/lib/stats";

// Composition serveur de la landing (§3) : les sections suivantes s'ajoutent sous le hero.
export default async function Home() {
  const stats = await fetchPublicStats();
  return (
    <>
      <Nav />
      <main>
        <Hero stats={stats} />
      </main>
      <MobileCtaBar />
    </>
  );
}
