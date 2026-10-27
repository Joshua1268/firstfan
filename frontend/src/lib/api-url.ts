// Django URL as seen from the Next server (SSR and rewrites).
export const DEFAULT_API_URL = "http://127.0.0.1:8010";

export function apiBaseUrl(): string {
  return process.env.API_INTERNAL_URL || DEFAULT_API_URL;
}
