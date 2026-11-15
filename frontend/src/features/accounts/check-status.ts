import { formatDate } from "../../lib/dates";
import type { ChecksOverview } from "./types";

export type StatusView = { tone: "waiting" | "success" | "danger"; label: string; help: string };

export const INCOMPLETE: StatusView = {
  tone: "waiting",
  label: "Profil incomplet",
  help: "Ajoute ton métier et ton numéro mobile money pour postuler aux campagnes.",
};

// What the tester's home says about the check of their profession.
export function checkStatusView(overview: ChecksOverview): StatusView {
  const latest = overview.checks.find((c) => c.profession === overview.profession);
  switch (overview.status) {
    case "verified":
      return {
        tone: "success",
        label: "Métier vérifié",
        help: latest?.expires_at
          ? `Valable jusqu'au ${formatDate(latest.expires_at)}. Les développeurs qui ciblent ton métier peuvent te choisir.`
          : "Les développeurs qui ciblent ton métier peuvent te choisir.",
      };
    case "pending":
      return {
        tone: "waiting",
        label: "Vérification en cours",
        help: "L'équipe examine ta pièce. Tu peux déjà postuler : le développeur pourra te choisir dès qu'elle est validée.",
      };
    case "rejected":
      return {
        tone: "danger",
        label: "Pièce refusée",
        help: `${latest?.reject_reason ? `Motif : ${latest.reject_reason} ` : ""}Envoie une autre pièce pour faire vérifier ton métier.`,
      };
    default:
      return {
        tone: "waiting",
        label: "Prêt à tester",
        help: "Postule aux campagnes ouvertes. Celles qui visent ton métier te demandent une pièce qui le prouve.",
      };
  }
}
