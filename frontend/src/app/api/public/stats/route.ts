import { fetchPublicStats } from "@/lib/stats";

/**
 * Compteurs publics pour le polling de la section « En direct » (même origine que la page : pas de CORS à ouvrir).
 *
 * La réécriture `/api/:path*` atteindrait aussi Django, mais cette route (prioritaire sur les réécritures, avec ou
 * sans barre finale) apporte ce qu'un simple relais n'a pas : un seul appel à Django toutes les 15 s quel que
 * soit le nombre de visiteurs (cache de `fetchPublicStats`, qui reste sous la limite de débit de la vue), un
 * délai de 1500 ms, et un 503 sans aucun chiffre si l'API est injoignable.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await fetchPublicStats();
  if (!stats)
    return Response.json({ detail: "stats indisponibles" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return Response.json(stats, { headers: { "Cache-Control": "public, max-age=15" } });
}
