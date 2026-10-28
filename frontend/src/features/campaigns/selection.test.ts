import { describe, expect, it } from "vitest";
import { rankedByAi, rankingLabel, selectionCount, toggleTester } from "./selection";

describe("toggleTester", () => {
  it("adds a tester that is not selected", () => {
    expect(toggleTester([1], 2, 3)).toEqual([1, 2]);
  });

  it("removes a tester that is already selected", () => {
    expect(toggleTester([1, 2], 1, 3)).toEqual([2]);
  });

  it("stops at the number of testers wanted", () => {
    expect(toggleTester([1, 2], 3, 2)).toEqual([1, 2]);
  });

  it("still removes a tester when the list is full", () => {
    expect(toggleTester([1, 2], 2, 2)).toEqual([1]);
  });

  it("does not change the given list", () => {
    const selected = [1];
    toggleTester(selected, 2, 3);
    expect(selected).toEqual([1]);
  });
});

describe("selectionCount", () => {
  it("reads as chosen out of wanted", () => {
    expect(selectionCount(2, 3)).toBe("2 sur 3");
  });
});

describe("rankingLabel", () => {
  it("names the AI when a model ranked the testers", () => {
    expect(rankingLabel("groq")).toBe("Classement par IA");
    expect(rankingLabel("mistral")).toBe("Classement par IA");
  });

  it("falls back to the rating otherwise", () => {
    expect(rankingLabel("rules")).toBe("Classement par note");
  });
});

describe("rankedByAi", () => {
  it("is true only for the AI providers", () => {
    expect(rankedByAi("groq")).toBe(true);
    expect(rankedByAi("mistral")).toBe(true);
    expect(rankedByAi("rules")).toBe(false);
  });
});
