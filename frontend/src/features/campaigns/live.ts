import type { CampaignDetail, LiveProof } from "./types";

export type LiveStep = { order: number; instruction: string; proof: LiveProof | null };

// The API lists proofs only; the board shows every scenario step, done or not.
export function stepsWithProofs(steps: CampaignDetail["steps"], proofs: LiveProof[]): LiveStep[] {
  return steps.map((step) => ({ ...step, proof: proofs.find((p) => p.step_order === step.order) ?? null }));
}
