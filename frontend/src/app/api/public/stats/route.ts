import { fetchPublicStats } from "@/lib/stats";

/**
 * Compteurs publics pour le polling de la section « En direct » (même origine que la page : pas de CORS à ouvrir).
 *
 * Pourquoi une route et pas la réécriture `/api/:path*` : Next retire la barre finale (308 vers
 * `/api/public/stats`) et Django la remet (301 vers `/api/public/stats/`), ce qui boucle. Cette route
 * (prioritaire sur les réécritures) relit Django côté serveur, avec le délai de 1500 ms et le cache de 15 s
 * de `fetchPublicStats`. API injoignable : 503, sans aucun chiffre.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await fetchPublicStats();
  if (!stats) return Response.json({ detail: "stats indisponibles" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return Response.json(stats, { headers: { "Cache-Control": "public, max-age=15" } });
}
