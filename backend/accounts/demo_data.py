from pathlib import Path

# (first name, initial, profession, city, verified, rating)
DEMO_TESTERS = [
    ("Awa", "K", "Comptable", "Plateau", True, "4.90"),
    ("Koffi", "A", "Gérant de maquis", "Yopougon", True, "4.70"),
    ("Grâce", "T", "Restauratrice", "Cocody", True, "4.80"),
    ("Mariam", "D", "Pharmacienne", "Marcory", True, "4.60"),
    ("Yao", "B", "Transitaire", "Treichville", True, "4.50"),
    ("Fatou", "S", "Couturière", "Abobo", True, "4.70"),
    ("Serge", "N", "Agent immobilier", "Cocody", True, "4.40"),
    ("Adjoua", "M", "Commerçante", "Adjamé", True, "4.80"),
    ("Ibrahim", "C", "Chauffeur VTC", "Koumassi", True, "4.60"),
    ("Esther", "G", "Infirmière", "Bouaké", True, "4.90"),
    ("Didier", "O", "Enseignant", "Port-Bouët", False, None),
    ("Salimata", "F", "Coiffeuse", "Yopougon", False, None),
    ("Bintou", "Y", "Comptable", "Cocody", True, "4.70"),
    ("Kouassi", "E", "Comptable", "Marcory", True, "4.60"),
]

DEMO_DEV = {"email": "demo-dev@firstfan.demo", "first_name": "Kader"}
# Username used before logins switched to the email; renamed on the next seed.
LEGACY_DEV_USERNAME = "demo-dev"

DEMO_TESTER = {
    "email": "demo-testeur@firstfan.demo",
    "first_name": "Aya",
    "last_name": "K.",
    "profession": "Comptable",
    "city": "Cocody",
    "momo_number": "0700000050",
    "linkedin_url": "https://www.linkedin.com/in/firstfan-demo",
}

DEMO_PROJECT = {
    "name": "Compta Express (démo)",
    "url": "https://compta-express.example",
    "description": "Factures, relances et trésorerie pour les cabinets comptables d'Abidjan.",
}

DEMO_PROFESSION = "Comptable"

DEMO_STEPS = [
    "Crée un compte et ajoute ton cabinet.",
    "Saisis une facture client de 150 000 FCFA.",
    "Envoie une relance pour une facture en retard.",
]

# One screenshot per scenario step.
DEMO_CAPTURES = [Path(__file__).parent / "demo_assets" / f"step-{i}.png" for i in (1, 2, 3)]

# Mixed adoption table: back at J1 and J7, at J7 only, too early to tell.
DEMO_TESTS = [
    {
        "status": "validated",
        "started_days_ago": 35,
        "return_days": [0.1, 2, 10],
        "answers": ["Compte créé en 2 minutes.", "Facture saisie sans souci.", "Relance envoyée par SMS."],
        "feedback": {
            "usefulness": 5,
            "blockers": "Aucun.",
            "would_pay": "yes",
            "comment": "Je l'utiliserais pour mes clients.",
        },
        "dev_score": 5,
        "tester_score": 5,
    },
    {
        "status": "submitted",
        "started_days_ago": 12,
        "return_days": [0.1, 8],
        "answers": ["Compte créé.", "Le champ TVA m'a bloqué un moment.", "Relance envoyée."],
        "feedback": {
            "usefulness": 4,
            "blockers": "Le taux de TVA n'est pas prérempli.",
            "would_pay": "maybe",
            "comment": "",
        },
        "dev_score": 4,
    },
    {
        "status": "accepted",
        "started_days_ago": 3,
        "return_days": [0.1, 1.5],
        "answers": ["Compte créé.", "Facture saisie, le PDF sort bien."],
    },
]

RECRUITING_STEPS = [
    "Crée ton compte et ton premier client",
    "Programme une relance de facture",
    "Dis si tu utiliserais ces relances chaque semaine",
]
