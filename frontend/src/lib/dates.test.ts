import { describe, expect, it } from "vitest";
import { formatDateTime } from "./dates";

describe("formatDateTime", () => {
  it("shows the date and time in Abidjan", () => {
    expect(formatDateTime("2026-10-27T14:05:00Z")).toBe("27 oct. 2026, 14:05");
  });
  it("converts other time zones", () => {
    expect(formatDateTime("2026-10-27T23:30:00+02:00")).toBe("27 oct. 2026, 21:30");
  });
});
