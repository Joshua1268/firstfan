import { apiFetch } from "@/lib/api-client";
import type { CampaignDetail, CampaignInput, CampaignSummary, Checkout, TesterCandidates } from "./types";

export function getProjectCampaigns(projectId: number): Promise<CampaignSummary[]> {
  return apiFetch(`/api/projects/${projectId}/campaigns/`);
}

export function createCampaign(projectId: number, input: CampaignInput): Promise<CampaignDetail> {
  return apiFetch(`/api/projects/${projectId}/campaigns/`, { method: "POST", json: input });
}

export function getCampaign(id: number): Promise<CampaignDetail> {
  return apiFetch(`/api/campaigns/${id}/`);
}

export function getTesterCandidates(campaignId: number): Promise<TesterCandidates> {
  return apiFetch(`/api/campaigns/${campaignId}/testers/`);
}

export function selectTesters(campaignId: number, testerIds: number[]): Promise<void> {
  return apiFetch(`/api/campaigns/${campaignId}/selection/`, { method: "POST", json: { tester_ids: testerIds } });
}

export function startCheckout(campaignId: number): Promise<Checkout> {
  return apiFetch(`/api/campaigns/${campaignId}/checkout/`, { method: "POST" });
}
