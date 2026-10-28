export type CampaignStatus = "draft" | "open" | "closed";

export type InvitationStatus = "selected" | "sent" | "accepted" | "declined" | "submitted" | "validated" | "rejected";

export type CampaignSummary = {
  id: number;
  target_profession: string;
  testers_wanted: number;
  status: CampaignStatus;
  created_at: string;
};

export type CampaignInput = {
  target_profession: string;
  testers_wanted: number;
  steps: string[];
};

export type InvitationRow = {
  id: number;
  tester: { id: number; first_name: string; profession: string };
  status: InvitationStatus;
  steps_done: number;
  steps_total: number;
};

export type CampaignDetail = {
  id: number;
  project: { id: number; name: string; url: string };
  target_profession: string;
  testers_wanted: number;
  status: CampaignStatus;
  is_demo: boolean;
  steps: { order: number; instruction: string }[];
  price_per_tester_xof: number;
  total_xof: number;
  payment: { reference: string; status: string } | null;
  invitations: InvitationRow[];
};

export type TesterCandidate = {
  id: number;
  first_name: string;
  last_initial: string;
  profession: string;
  city: string;
  rating_avg: number | null;
  completed_tests: number;
  recommended: boolean;
  selected: boolean;
  reason: string;
};

// source: "groq", "mistral" or "rules", whichever ranked the candidates.
export type TesterCandidates = { source: string; candidates: TesterCandidate[] };

export type Checkout = { reference: string; redirect_url: string };
