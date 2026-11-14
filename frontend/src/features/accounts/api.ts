import { apiFetch } from "@/lib/api-client";
import type { ChecksOverview, Me, ProfessionCheck, RegisterInput, TesterProfile } from "./types";

export function register(input: RegisterInput): Promise<Me> {
  return apiFetch("/api/auth/register/", { method: "POST", json: input });
}

export function login(email: string, password: string): Promise<Me> {
  return apiFetch("/api/auth/login/", { method: "POST", json: { email, password } });
}

export function logout(): Promise<void> {
  return apiFetch("/api/auth/logout/", { method: "POST" });
}

export function getMe(): Promise<Me> {
  return apiFetch("/api/auth/me/");
}

export function getProfessions(): Promise<string[]> {
  return apiFetch("/api/professions/");
}

export function getTesterProfile(): Promise<TesterProfile> {
  return apiFetch("/api/tester/profile/");
}

export function updateTesterProfile(form: FormData): Promise<TesterProfile> {
  return apiFetch("/api/tester/profile/", { method: "PATCH", body: form });
}

export function getChecks(): Promise<ChecksOverview> {
  return apiFetch("/api/tester/checks/");
}

// form holds document_type, document, consent and, if given, sponsor_email.
export function submitCheck(form: FormData): Promise<ProfessionCheck> {
  return apiFetch("/api/tester/checks/", { method: "POST", body: form });
}

export function getGoogleStatus(): Promise<{ enabled: boolean }> {
  return apiFetch("/api/auth/google/");
}
