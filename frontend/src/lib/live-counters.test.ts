import { describe, expect, it } from "vitest";
import { liveCounters, liveSummary } from "./live-counters";

const s = (tests_in_progress: number, verified_testers: number, apps_tested: number) => ({
  tests_in_progress,
  verified_testers,
  apps_tested,
  demo: true,
});

describe("liveCounters", () => {
  it("keeps the three counters, in order, when all are positive", () => {
    expect(liveCounters(s(3, 10, 2))).toEqual([
      { key: "tests_in_progress", value: 3, label: "tests en cours" },
      { key: "verified_testers", value: 10, label: "testeurs vérifiés" },
      { key: "apps_tested", value: 2, label: "apps testées" },
    ]);
  });
  it("never shows a zero: demo data (0 / 10 / 0) leaves only the verified testers", () => {
    expect(liveCounters(s(0, 10, 0))).toEqual([{ key: "verified_testers", value: 10, label: "testeurs vérifiés" }]);
  });
  it("drops any zero counter and keeps the others", () => {
    expect(liveCounters(s(1, 0, 1)).map((c) => c.key)).toEqual(["tests_in_progress", "apps_tested"]);
    expect(liveCounters(s(1, 0, 1)).map((c) => c.label)).toEqual(["test en cours", "app testée"]);
  });
  it("returns nothing when every counter is zero or stats are missing", () => {
    expect(liveCounters(s(0, 0, 0))).toEqual([]);
    expect(liveCounters(null)).toEqual([]);
  });
  it("ignores values that are not real positive numbers", () => {
    expect(liveCounters(s(-1, Number.NaN, 4))).toEqual([{ key: "apps_tested", value: 4, label: "apps testées" }]);
  });
});

describe("liveSummary", () => {
  it("lists only what is shown", () => {
    expect(liveSummary(liveCounters(s(0, 10, 0)))).toBe("10 testeurs vérifiés.");
    expect(liveSummary([])).toBe("");
  });
});
