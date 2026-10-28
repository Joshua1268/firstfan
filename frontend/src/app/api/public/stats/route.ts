import { fetchPublicStats } from "@/lib/stats";

// Wins over the API rewrite: one cached Django call every 15s for all visitors, and a 503 when Django is down.
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await fetchPublicStats();
  if (!stats)
    return Response.json({ detail: "stats indisponibles" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return Response.json(stats, { headers: { "Cache-Control": "public, max-age=15" } });
}
