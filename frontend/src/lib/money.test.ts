import { describe, expect, it } from "vitest";
import { formatXof } from "./money";

describe("formatXof", () => {
  it("groups thousands with a narrow no-break space", () => {
    expect(formatXof(5000)).toBe("5 000 FCFA");
    expect(formatXof(1250000)).toBe("1 250 000 FCFA");
  });
  it("leaves small amounts alone", () => {
    expect(formatXof(0)).toBe("0 FCFA");
    expect(formatXof(350)).toBe("350 FCFA");
  });
});
