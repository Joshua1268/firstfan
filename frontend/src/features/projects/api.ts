import { ApiError, apiFetch } from "@/lib/api-client";
import type { ProjectDetail, ProjectSummary } from "./types";

export function getProjects(): Promise<ProjectSummary[]> {
  return apiFetch("/api/projects/");
}

export function getProject(id: number): Promise<ProjectDetail> {
  return apiFetch(`/api/projects/${id}/`);
}

// FormData: name, url, description and up to 3 "captures" files.
export function createProject(form: FormData): Promise<ProjectDetail> {
  return apiFetch("/api/projects/", { method: "POST", body: form });
}

// The browser downloads the file itself from this address.
export function certificateUrl(id: number): string {
  return `/api/projects/${id}/certificate/`;
}

// The certificate is plain text, not JSON.
export async function getCertificate(id: number): Promise<string> {
  const res = await fetch(certificateUrl(id), { credentials: "same-origin" });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  return res.text();
}
