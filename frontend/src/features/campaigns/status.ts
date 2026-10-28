import type { CampaignStatus } from "./types";

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: "waiting" | "success" | "danger" }> = {
  draft: { label: "Brouillon", tone: "waiting" },
  open: { label: "En cours", tone: "success" },
  closed: { label: "Terminée", tone: "waiting" },
};
