import { describe, expect, it } from "vitest";
import { heroBadge } from "./hero-badge";

const s = (tests_in_progress: number, verified_testers: number) => ({
  tests_in_progress,
  verified_testers,
  apps_tested: 0,
  demo: true,
});

describe("heroBadge", () => {
  it("shows tests in progress when there are some", () => {
    expect(heroBadge(s(3, 10))).toEqual({ value: 3, label: "tests en cours" });
    expect(heroBadge(s(1, 10))).toEqual({ value: 1, label: "test en cours" });
  });
  it("falls back to the real verified testers count when no test is running", () => {
    expect(heroBadge(s(0, 10))).toEqual({ value: 10, label: "testeurs vérifiés" });
    expect(heroBadge(s(0, 1))).toEqual({ value: 1, label: "testeur vérifié" });
  });
  it("hides the badge when both counts are 0 or stats are missing", () => {
    expect(heroBadge(s(0, 0))).toBeNull();
    expect(heroBadge(null)).toBeNull();
  });
});
