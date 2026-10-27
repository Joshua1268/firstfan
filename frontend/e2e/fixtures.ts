import { test as base, expect } from "@playwright/test";

// Above the stage's low-end device threshold (fewer than 4 cores).
export const DEFAULT_CORES = 8;

export function pinCores(cores: number) {
  return {
    content: `Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { configurable: true, get: () => ${cores} });`,
  };
}

// Pins 8 cores so a small CI runner does not get the static stage fallback.
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript(pinCores(DEFAULT_CORES));
    await provide(context);
  },
});

export { expect };
