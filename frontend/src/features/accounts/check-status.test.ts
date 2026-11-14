import { describe, expect, it } from "vitest";
import { checkStatusView } from "./check-status";
import type { ChecksOverview, ProfessionCheck } from "./types";

const check: ProfessionCheck = {
  id: 1,
  profession: "Médecin",
  document_type: "order_card",
  document_label: "Carte de l'Ordre",
  status: "rejected",
  reject_reason: "Pièce illisible.",
  created_at: "2026-11-14T10:00:00Z",
  expires_at: null,
};

function overview(status: ChecksOverview["status"], checks: ProfessionCheck[] = []): ChecksOverview {
  return { profession: "Médecin", status, documents: [], checks };
}

describe("checkStatusView", () => {
  it("invites a tester without any check to apply", () => {
    expect(checkStatusView(overview(null)).label).toBe("Prêt à tester");
  });

  it("shows the reason of a refusal", () => {
    const view = checkStatusView(overview("rejected", [check]));
    expect(view.tone).toBe("danger");
    expect(view.help).toContain("Motif : Pièce illisible.");
  });

  it("shows until when a check is valid", () => {
    const verified = { ...check, status: "verified" as const, expires_at: "2027-11-14T10:00:00Z" };
    expect(checkStatusView(overview("verified", [verified])).help).toContain("14 novembre 2027");
  });
});
