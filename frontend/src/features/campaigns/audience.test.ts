import { describe, expect, it } from "vitest";
import { audienceLabel } from "./audience";

describe("audienceLabel", () => {
  it("names the target profession", () => {
    expect(audienceLabel("Médecin")).toBe("Médecin");
  });
  it("calls an empty target open to all", () => {
    expect(audienceLabel("")).toBe("Tout public");
  });
});
