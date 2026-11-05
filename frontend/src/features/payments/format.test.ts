import { describe, expect, it } from "vitest";
import { maskMomo, parseAmount } from "./format";

describe("maskMomo", () => {
  it("keeps only the first and last two digits", () => {
    expect(maskMomo("0700000099")).toBe("07 •• •• •• 99");
    expect(maskMomo("07 00 00 00 99")).toBe("07 •• •• •• 99");
  });
  it("leaves a number too short to hide", () => {
    expect(maskMomo("")).toBe("");
    expect(maskMomo("0701")).toBe("0701");
  });
});

describe("parseAmount", () => {
  it("reads digits with or without thousand separators", () => {
    expect(parseAmount("3500")).toBe(3500);
    expect(parseAmount("3 500")).toBe(3500);
    expect(parseAmount(" 3 500 ")).toBe(3500);
    expect(parseAmount("3.500")).toBe(3500);
    expect(parseAmount("0")).toBe(0);
  });
  it("rejects anything that is not a whole amount", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("12,5")).toBeNull();
  });
});
