import { apiFetch } from "@/lib/api-client";
import type { Adoption } from "./types";

export function getAdoption(projectId: number): Promise<Adoption> {
  return apiFetch(`/api/projects/${projectId}/adoption/`);
}
