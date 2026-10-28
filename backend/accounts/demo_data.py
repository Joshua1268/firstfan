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

DEMO_DEV = {"username": "demo-dev", "email": "demo-dev@firstfan.demo", "first_name": "Kader"}

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

# 1 x 1 transparent PNG, used as step capture.
DEMO_CAPTURE = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4"
    b"\x89\x00\x00\x00\x0bIDATx\x9cc`\x00\x02\x00\x00\x05\x00\x01z^\xab?\x00\x00\x00\x00IEND\xaeB`\x82"
)

# One test per invited tester. Return days are counted from the test start and give
# a mixed adoption table: back at J1 and J7 then gone, back at J7 only, too early to tell.
DEMO_TESTS = [
    {
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
        "tester_score": 4,
    },
    {
        "started_days_ago": 3,
        "return_days": [0.1, 1.5],
        "answers": ["Compte créé.", "Facture saisie.", "Je n'ai pas trouvé le bouton tout de suite."],
        "feedback": {
            "usefulness": 4,
            "blockers": "Le bouton de relance est caché dans le menu.",
            "would_pay": "yes",
            "comment": "Pratique sur téléphone.",
        },
        "dev_score": 5,
        "tester_score": 5,
    },
]
