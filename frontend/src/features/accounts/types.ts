export type Role = "dev" | "tester";

export type Me = {
  id: number;
  email: string;
  first_name: string;
  role: Role | "admin";
  profile_complete: boolean;
};

export type RegisterInput = {
  email: string;
  password: string;
  first_name: string;
  role: Role;
  consent: boolean;
};

export type TesterProfile = {
  profession: string;
  company: string;
  city: string;
  linkedin_url: string;
  momo_number: string;
  available: boolean;
  rating_avg: number | null;
};

export type CheckStatus = "pending" | "verified" | "rejected";

export type ProfessionCheck = {
  id: number;
  profession: string;
  document_type: string;
  document_label: string;
  status: CheckStatus;
  reject_reason: string;
  created_at: string;
  expires_at: string | null;
};

// documents: the pieces accepted for the tester's profession.
export type ChecksOverview = {
  profession: string;
  status: CheckStatus | null;
  documents: { value: string; label: string }[];
  checks: ProfessionCheck[];
};
