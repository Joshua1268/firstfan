import { describe, expect, it } from "vitest";
import { googleMessage, googleStartUrl } from "./google";

function params(url: string) {
  const [path, query] = url.split("?");
  return { path, query: Object.fromEntries(new URLSearchParams(query)) };
}

describe("googleStartUrl", () => {
  it("starts a login and keeps next", () => {
    expect(params(googleStartUrl({ intent: "login", next: "/dev/projets/3?tab=suivi" }))).toEqual({
      path: "/api/auth/google/start/",
      query: { intent: "login", next: "/dev/projets/3?tab=suivi" },
    });
  });

  it("starts a login without next", () => {
    expect(googleStartUrl({ intent: "login", next: null })).toBe("/api/auth/google/start/?intent=login");
  });

  it("starts a dev signup", () => {
    expect(params(googleStartUrl({ intent: "signup", role: "dev", consent: false })).query).toEqual({
      intent: "signup",
      role: "dev",
    });
  });

  it("sends the tester consent", () => {
    expect(params(googleStartUrl({ intent: "signup", role: "tester", consent: true })).query).toEqual({
      intent: "signup",
      role: "tester",
      consent: "1",
    });
  });
});

describe("googleMessage", () => {
  it("explains an unknown Google account", () => {
    expect(googleMessage("inconnu")).toBe(
      "Aucun compte FirstFan avec ce compte Google : choisis ton rôle pour t'inscrire.",
    );
  });

  it("ignores a missing or unknown code", () => {
    expect(googleMessage(undefined)).toBeNull();
    expect(googleMessage("autre")).toBeNull();
    expect(googleMessage(["annule", "refuse"])).toBeNull();
  });
});
