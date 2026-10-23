export type PublicStats = {
  tests_in_progress: number;
  verified_testers: number;
  apps_tested: number;
  demo: boolean;
};

export async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch(`${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000"}/api/public/stats/`, {
      next: { revalidate: 15 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicStats;
  } catch {
    return null;
  }
}
