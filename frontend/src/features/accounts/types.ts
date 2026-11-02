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

export type Verification = "pending" | "verified" | "rejected";

export type TesterProfile = {
  profession: string;
  company: string;
  city: string;
  linkedin_url: string;
  momo_number: string;
  available: boolean;
  verification: Verification;
  has_proof: boolean;
  rating_avg: number | null;
};
