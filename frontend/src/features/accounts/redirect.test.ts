import { describe, expect, it } from "vitest";
import { homeFor } from "./redirect";
import type { Me } from "./types";

const dev: Me = { id: 1, email: "awa@x.ci", first_name: "Awa", role: "dev", profile_complete: true };
const newTester: Me = { id: 2, email: "koffi@x.ci", first_name: "Koffi", role: "tester", profile_complete: false };
const tester: Me = { ...newTester, profile_complete: true };

describe("homeFor", () => {
  it("sends a dev to the dev space", () => {
    expect(homeFor(dev)).toBe("/dev");
  });

  it("sends a tester with an incomplete profile to the profile form", () => {
    expect(homeFor(newTester)).toBe("/testeur/profil");
  });

  it("sends a tester with a complete profile to the tester space", () => {
    expect(homeFor(tester)).toBe("/testeur");
  });

  it("keeps a local next path", () => {
    expect(homeFor(dev, "/dev/projets/3?tab=suivi")).toBe("/dev/projets/3?tab=suivi");
  });

  it("ignores a next that leaves the site", () => {
    const outside = [
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "\\/evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "dev",
      "",
    ];
    for (const next of outside) {
      expect(homeFor(dev, next), next).toBe("/dev");
    }
  });

  it("ignores a missing next", () => {
    expect(homeFor(tester, null)).toBe("/testeur");
    expect(homeFor(tester, undefined)).toBe("/testeur");
  });

  it("sends an admin to the home page", () => {
    expect(homeFor({ ...dev, role: "admin" })).toBe("/");
  });
});
