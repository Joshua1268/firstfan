import { describe, expect, it } from "vitest";
import { WINDOWS, windowSummary } from "./summary";

const [J1, J7, J30] = WINDOWS;
import type { AdoptionRow } from "./types";

function row(d1: boolean | null, d7: boolean | null, d30: boolean | null): AdoptionRow {
  return {
    invitation_id: 1,
    tester_first_name: "Awa",
    profession: "Comptable",
    started_at: "2026-10-01T10:00:00Z",
    d1,
    d7,
    d30,
  };
}

const rows = [row(true, true, false), row(false, true, null), row(true, null, null)];

describe("windowSummary", () => {
  it("counts returns among testers whose window has started", () => {
    expect(windowSummary(rows, J1)).toBe("2 sur 3 reviennent à J1");
    expect(windowSummary(rows, J7)).toBe("2 sur 2 reviennent à J7");
  });

  it("uses the singular for zero or one return", () => {
    expect(windowSummary(rows, J30)).toBe("0 sur 1 revient à J30");
    expect(windowSummary([row(true, null, null)], J1)).toBe("1 sur 1 revient à J1");
  });

  it("says when nothing is measured yet", () => {
    expect(windowSummary([row(null, null, null)], J1)).toBe("J1 : pas encore mesuré");
    expect(windowSummary([], J7)).toBe("J7 : pas encore mesuré");
  });
});
