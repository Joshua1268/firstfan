import { describe, expect, it } from "vitest";
import { footerLinks, navLinks, PAGE_CTA } from "./site-links";

describe("site links", () => {
  it("keeps same-page anchors on the home page", () => {
    expect(navLinks("home").map((l) => l.href)).toEqual(["#comment-ca-marche", "/testeurs", "#entre-devs"]);
  });
  it("points home anchors back to the home page from /testeurs", () => {
    for (const links of [navLinks("testeurs"), footerLinks("testeurs")])
      for (const l of links) expect(l.href.startsWith("#"), l.href).toBe(false);
    expect(navLinks("testeurs").map((l) => l.href)).toEqual(["/#comment-ca-marche", "/testeurs", "/#entre-devs"]);
  });
  it("sends testers to their own page, never straight to the form", () => {
    for (const page of ["home", "testeurs"] as const) {
      expect(navLinks(page).find((l) => l.label === "Pour les testeurs")?.href).toBe("/testeurs");
      expect(footerLinks(page).find((l) => l.label === "Devenir testeur")?.href).toBe("/testeurs");
    }
  });
  it("gives each page one action for its own audience", () => {
    expect(PAGE_CTA.home).toEqual({ href: "/inscription?role=dev", label: "Je suis développeur" });
    expect(PAGE_CTA.testeurs).toEqual({ href: "/inscription?role=tester", label: "Proposer mon profil" });
  });
});
