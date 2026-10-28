import type { CampaignStatus, InvitationStatus } from "./types";

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: "waiting" | "success" | "danger" }> = {
  draft: { label: "Brouillon", tone: "waiting" },
  open: { label: "Ouverte", tone: "success" },
  closed: { label: "Terminée", tone: "waiting" },
};

export const INVITATION_STATUS: Record<InvitationStatus, { label: string; tone: "waiting" | "success" | "danger" }> = {
  selected: { label: "Sélectionné", tone: "waiting" },
  sent: { label: "Envoyée", tone: "waiting" },
  accepted: { label: "Acceptée", tone: "success" },
  declined: { label: "Refusée", tone: "danger" },
  submitted: { label: "Test envoyé", tone: "success" },
  validated: { label: "Validé", tone: "success" },
  rejected: { label: "Rejeté", tone: "danger" },
};
