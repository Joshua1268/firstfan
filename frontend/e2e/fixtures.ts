import { test as base, expect } from "@playwright/test";

/** Nombre de cœurs annoncé par défaut dans les tests (au-dessus du seuil « appareil modeste » du stage, < 4). */
export const DEFAULT_CORES = 8;

/** Script d'initialisation qui fixe `navigator.hardwareConcurrency`. */
export function pinCores(cores: number) {
  return {
    content: `Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { configurable: true, get: () => ${cores} });`,
  };
}

/**
 * `test` de la landing : le contexte de chaque test annonce 8 cœurs. Sans ça, sur une machine à moins de 4 cœurs
 * (runner CI à 2 vCPU), le stage passe en repli « appareil modeste », son module animé n'est jamais chargé et
 * tous les tests qui le pilotent expirent. Le chemin modeste a son propre test (cœurs forcés à 2).
 */
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript(pinCores(DEFAULT_CORES));
    await provide(context);
  },
});

export { expect };
