import { PRODUCT_NAME } from "@/lib/brand";

// French typography: non-breaking spaces inside quotes and before ? : !
const fr = (t: string) =>
  t
    .replace(/« /g, "«\u00a0")
    .replace(/ »/g, "\u00a0»")
    .replace(/ (?=[?:!])/g, "\u00a0");

// Shared by the animated stage and the static fallback.

export const LOOP = {
  kicker: "TU CONNAIS LA BOUCLE",
  title: fr("On te dit « c'est super ». Personne ne l'utilise."),
  labels: ["Je construis", "« C'est super ! »", "Personne n'utilise", "J'abandonne"],
  tours: ["Tour 1 : Bilio", "Tour 2 : mcp-studio", "Tour 3 : ton prochain projet"],
  voice: "À l'ère de l'IA, construire, c'est facile. Trouver de vrais utilisateurs, c'est ça le vrai travail.",
  bubbles: ["c'est super", "vraiment joli", "bravo frère", "je vais tester demain", "en tout cas c'est propre"],
} as const;

export const BREAK = {
  title: fr("Et si on cassait la boucle ?"),
  line: fr("Au lieu de « c'est super », imagine entendre : « je l'utilise encore »."),
} as const;

export const VOICES = {
  kicker: "DEUX CÔTÉS DE LA TABLE",
  dev: {
    quote: "J'ai lancé Bilio. Puis mcp-studio. Tout le monde m'a dit : c'est super. Personne n'est revenu.",
    sign: `Le fondateur de ${PRODUCT_NAME}, dev à Abidjan`,
  },
  pro: {
    quote:
      "On me demande mon avis gratuitement, sur des outils qui ne connaissent rien à mon travail. Moi aussi, je veux qu'on m'écoute pour de vrai.",
    sign: "Une comptable, Plateau",
  },
  close: "Deux personnes qui ont besoin l'une de l'autre. Il manquait juste l'endroit.",
} as const;

export type Step = { kicker: string; title: string; dev: string; pro: string };

export const STEP1: Step = {
  kicker: "01 · TU CHOISIS TES TESTEURS",
  title: "Des pros de ton métier cible. Vérifiés.",
  dev: "CV, LinkedIn ou justificatif : on vérifie le métier avant tout. Tu choisis, on te recommande les mieux notés.",
  pro: "Ton métier est vérifié une fois. Après, ce sont les devs qui viennent te chercher.",
};

export const TESTERS = [
  { name: "Awa K.", job: "Comptable", rating: "4,9 / 5", tag: "Recommandée" },
  { name: "Koffi A.", job: "Gérant de maquis", rating: "4,7 / 5" },
  { name: "Grâce T.", job: "Restauratrice", rating: "4,8 / 5" },
] as const;

export const STEP2: Step = {
  kicker: "02 · ILS TESTENT POUR DE VRAI",
  title: "Un parcours guidé, des preuves horodatées.",
  dev: "Chaque étape est cochée, chaque écran capturé. Personne ne fait semblant d'avoir testé.",
  pro: "Un parcours clair sur ton téléphone. Tu testes à ton rythme, entre deux clients.",
};

export const CHECKLIST = ["Créer un compte", "Ajouter un client", "Envoyer une facture", "Relancer un impayé"] as const;
export const STAMPS = ["14:32:07", "14:33:41", "14:35:12", "14:36:58"] as const;

export const STEP3: Step = {
  kicker: "03 · DES RETOURS DE PROS",
  title: "Des avis francs, pas de la politesse.",
  dev: "Ce qui bloque, ce qui manque, ce qu'ils utiliseraient chaque mois. Et toi aussi, tu notes ton testeur.",
  pro: "Tu notes le dev, il te note. Une bonne note, c'est plus de missions proposées.",
};

export const FEEDBACK = [
  "« Le bouton Payer, je l'ai cherché deux minutes. »",
  "« Moi je classe mes factures par client, pas par date. »",
  "« Ça, je l'utiliserais chaque fin de mois. »",
] as const;

// "vers" is shown as an arrow icon but kept for screen readers.
export const RATINGS = {
  toDev: { from: "Testeuse", to: "dev", value: "4,6 / 5" },
  toTester: { from: "Dev", to: "testeuse", value: "Testeuse fiable · 5 / 5" },
} as const;

export const STEP4: Step = {
  kicker: "04 · ET ILS RESTENT",
  title: "Pas des likes. Des gens qui reviennent.",
  dev: "Un petit script dans ton app mesure qui l'utilise encore à J7 et à J30. Enfin de vrais chiffres d'usage.",
  pro: "Tu continues d'utiliser l'app ? Tu as des avantages. Et le parrainage n'est récompensé que sur usage réel.",
};

export const CURVES = {
  axis: ["J0", "J7", "J30"],
  ghost: "Les « c'est super »",
  green: "Tes testeurs vérifiés",
  j7: "Toujours là à J7",
  j30: "Encore là à J30",
  ctaDev: "Je fais tester mon app",
  ctaPro: "Voir le côté testeur",
} as const;

export const CARD = {
  url: "monapp.ci",
  title: "MonApp · MVP v0.3",
  clients: [
    { name: "Maquis Chez Tantie", status: "Payée" },
    { name: "Boutique Adjoua", status: "En attente" },
    { name: "Pharmacie du Plateau", status: "Impayée" },
  ],
  send: "Envoyer la facture",
  proof: "Métier vérifié",
} as const;

export const NAV = {
  label: "Étapes de l'histoire",
  items: [
    { scene: "loop", label: "Boucle" },
    { scene: "step1", label: "01" },
    { scene: "step2", label: "02" },
    { scene: "step3", label: "03" },
    { scene: "step4", label: "04" },
  ],
  skip: "Passer l'histoire",
} as const;
