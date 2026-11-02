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

export type Proof = { id: number; answer: string; capture_url: string; updated_at: string };

export type TestStep = { order: number; instruction: string; proof: Proof | null };

export type WouldPay = "yes" | "maybe" | "no";

export type Feedback = { usefulness: number; blockers: string; would_pay: WouldPay; comment: string };

export type TesterInvitationSummary = {
  id: number;
  project_name: string;
  target_profession: string;
  steps_total: number;
  steps_done: number;
  status: InvitationStatus;
  reward_xof: number;
  created_at: string;
};

export type TesterInvitationDetail = TesterInvitationSummary & {
  project_description: string;
  nda_accepted_at: string | null;
  // Null until the confidentiality commitment is accepted.
  test_url: string | null;
  steps: TestStep[];
  feedback: Feedback | null;
};

export type SubmitInput = Feedback & { dev_score: number; dev_comment: string };

export type LiveProof = { id: number; step_order: number; answer: string; capture_url: string; updated_at: string };

export type LiveRow = {
  invitation_id: number;
  tester: { first_name: string; profession: string; rating_avg: number | null };
  status: InvitationStatus;
  nda_accepted_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  last_event_at: string | null;
  proofs: LiveProof[];
  feedback: Feedback | null;
  // The dev's own rating of the tester, once the test is judged.
  dev_rating: { score: number; comment: string } | null;
};

export type Decision = "validated" | "rejected";

export type ValidateInput = { decision: Decision; score: number; comment: string };
