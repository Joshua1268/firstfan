// Nav and footer links. Off the home page, section anchors become "/#..." and the main action follows the audience.
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
    ...LEGAL_LINKS,
  ];
}

export const LEGAL_LINKS: SiteLink[] = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d'utilisation" },
  { href: "/contact", label: "Contact" },
];

export const PAGE_CTA: Record<SitePage, SiteLink> = {
  home: { href: "/inscription?role=dev", label: "Je suis développeur" },
  testeurs: { href: "/inscription?role=tester", label: "Proposer mon profil" },
};
