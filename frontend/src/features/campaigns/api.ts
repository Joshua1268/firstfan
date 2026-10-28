import { apiFetch } from "@/lib/api-client";
import type { CampaignDetail, CampaignInput, CampaignSummary } from "./types";

export function getProjectCampaigns(projectId: number): Promise<CampaignSummary[]> {
  return apiFetch(`/api/projects/${projectId}/campaigns/`);
}

export function createCampaign(projectId: number, input: CampaignInput): Promise<CampaignDetail> {
  return apiFetch(`/api/projects/${projectId}/campaigns/`, { method: "POST", json: input });
}

export function getCampaign(id: number): Promise<CampaignDetail> {
  return apiFetch(`/api/campaigns/${id}/`);
}
