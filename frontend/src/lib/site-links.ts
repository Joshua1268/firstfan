/**
 * Liens partagés de la nav et du footer. L'accueil parle aux devs, `/testeurs` aux pros : hors de l'accueil,
 * les ancres de sections de l'accueil deviennent « /#… », et l'action de la nav suit le public de la page.
 */
export type SitePage = "home" | "testeurs";

export type SiteLink = { href: string; label: string };

const homeAnchor = (page: SitePage, id: string) => `${page === "home" ? "" : "/"}#${id}`;

export function navLinks(page: SitePage): SiteLink[] {
  return [
    { href: homeAnchor(page, "comment-ca-marche"), label: "Comment ça marche" },
    { href: "/testeurs", label: "Pour les testeurs" },
    { href: homeAnchor(page, "entre-devs"), label: "Entre devs" },
  ];
}

export function footerLinks(page: SitePage): SiteLink[] {
  return [
    { href: homeAnchor(page, "comment-ca-marche"), label: "Comment ça marche" },
    { href: "/testeurs", label: "Devenir testeur" },
    { href: homeAnchor(page, "entre-devs"), label: "Pour les devs" },
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/contact", label: "Contact" },
  ];
}

/** Une seule action principale par page. */
export const PAGE_CTA: Record<SitePage, SiteLink> = {
  home: { href: "/inscription?role=dev", label: "Je suis développeur" },
  testeurs: { href: "/inscription?role=tester", label: "Proposer mon profil" },
};
