import { describe, expect, it } from "vitest";
import { stepsWithProofs } from "./live";

const steps = [
  { order: 1, instruction: "Crée une facture" },
  { order: 2, instruction: "Ajoute une dépense" },
  { order: 3, instruction: "Exporte le bilan" },
];
const proof = (order: number) => ({
  id: order * 10,
  step_order: order,
  answer: `Réponse ${order}`,
  capture_url: `/api/proofs/${order * 10}/capture/`,
  updated_at: "2026-10-28T10:00:00Z",
});

describe("stepsWithProofs", () => {
  it("keeps every step in scenario order, without proof when none was sent", () => {
    expect(stepsWithProofs(steps, [])).toEqual(steps.map((s) => ({ ...s, proof: null })));
  });

  it("puts each proof under its own step, whatever the proofs order", () => {
    const result = stepsWithProofs(steps, [proof(3), proof(1)]);
    expect(result.map((s) => s.proof?.id ?? null)).toEqual([10, null, 30]);
  });

  it("ignores a proof whose step is not in the scenario", () => {
    expect(stepsWithProofs(steps.slice(0, 1), [proof(2)])).toEqual([{ ...steps[0], proof: null }]);
  });
});
