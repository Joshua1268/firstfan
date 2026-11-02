import { apiFetch } from "@/lib/api-client";
import type {
  CampaignDetail,
  CampaignInput,
  CampaignSummary,
  Checkout,
  LiveRow,
  Proof,
  SubmitInput,
  TesterCandidates,
  TesterInvitationDetail,
  TesterInvitationSummary,
  ValidateInput,
} from "./types";

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

export function getLive(campaignId: number): Promise<LiveRow[]> {
  return apiFetch(`/api/campaigns/${campaignId}/live/`);
}

// Answers with the updated row.
export function validateTest(invitationId: number, input: ValidateInput): Promise<LiveRow> {
  return apiFetch(`/api/invitations/${invitationId}/validate/`, { method: "POST", json: input });
}

export function getTesterInvitations(): Promise<TesterInvitationSummary[]> {
  return apiFetch("/api/tester/invitations/");
}

export function getTesterInvitation(id: number): Promise<TesterInvitationDetail> {
  return apiFetch(`/api/tester/invitations/${id}/`);
}

export function acceptInvitation(id: number): Promise<TesterInvitationDetail> {
  return apiFetch(`/api/tester/invitations/${id}/accept/`, { method: "POST", json: { nda: true } });
}

export function declineInvitation(id: number): Promise<void> {
  return apiFetch(`/api/tester/invitations/${id}/decline/`, { method: "POST" });
}

// form holds "answer" and, when one was chosen, "capture".
export function saveStepProof(id: number, order: number, form: FormData): Promise<Proof> {
  return apiFetch(`/api/tester/invitations/${id}/steps/${order}/`, { method: "POST", body: form });
}

export function submitTest(id: number, input: SubmitInput): Promise<void> {
  return apiFetch(`/api/tester/invitations/${id}/submit/`, { method: "POST", json: input });
}
