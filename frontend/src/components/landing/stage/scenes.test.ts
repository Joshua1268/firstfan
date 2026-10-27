import { describe, expect, it } from "vitest";
import { SCENES, sceneAt, sceneStart } from "./scenes";

describe("stage scenes (§3.4)", () => {
  it("maps p to the seven ranges", () => {
    expect(sceneAt(0)).toBe("loop");
    expect(sceneAt(0.159)).toBe("loop");
    expect(sceneAt(0.16)).toBe("break");
    expect(sceneAt(0.22)).toBe("voices");
    expect(sceneAt(0.32)).toBe("step1");
    expect(sceneAt(0.48)).toBe("step2");
    expect(sceneAt(0.64)).toBe("step3");
    expect(sceneAt(0.8)).toBe("step4");
    expect(sceneAt(1)).toBe("step4");
  });
  it("lists the scenes in order and exposes their start", () => {
    expect(SCENES.map((s) => s.id)).toEqual(["loop", "break", "voices", "step1", "step2", "step3", "step4"]);
    expect(sceneStart("step2")).toBe(0.48);
  });
});
