import type { Role } from "./types";

export type GoogleStart =
  { intent: "login"; next?: string | null } | { intent: "signup"; role: Role; consent: boolean };

// A full-page link: Django answers with a redirect to Google, then back to the site.
export function googleStartUrl(start: GoogleStart): string {
  const params = new URLSearchParams({ intent: start.intent });
  if (start.intent === "signup") {
    params.set("role", start.role);
    if (start.consent) params.set("consent", "1");
  } else if (start.next) {
    params.set("next", start.next);
  }
  return `/api/auth/google/start/?${params}`;
}

// Codes sent back by the API in ?google= after a failed Google sign-in.
const MESSAGES: Record<string, string> = {
  annule: "Connexion avec Google annulée. Tu peux réessayer ou utiliser ton email.",
  refuse: "Google n'a pas confirmé l'adresse email de ce compte. Essaie un autre compte Google ou ton email.",
  invalide: "La connexion avec Google a échoué. Réessaie dans un instant.",
  indisponible: "La connexion avec Google n'est pas disponible pour le moment. Utilise ton email.",
  inconnu: "Aucun compte FirstFan avec ce compte Google : choisis ton rôle pour t'inscrire.",
  consentement: "Coche la case de consentement avant de continuer avec Google.",
};

export function googleMessage(code: string | string[] | undefined): string | null {
  return typeof code === "string" ? (MESSAGES[code] ?? null) : null;
}
