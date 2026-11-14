from .models import ProfessionCheck

Document = ProfessionCheck.Document

PROFESSIONS: list[str] = [
    "Agent immobilier",
    "Avocat",
    "Chauffeur VTC",
    "Coiffeuse",
    "Commerçante",
    "Comptable",
    "Couturière",
    "Développeur web",
    "Enseignant",
    "Gérant de maquis",
    "Infirmière",
    "Livreur",
    "Médecin",
    "Pharmacienne",
    "Restauratrice",
    "Transitaire",
]

HEALTH = [Document.ORDER_CARD, Document.PRO_CARD]
TRADE = [Document.BUSINESS_REGISTRY]
DRIVING = [Document.DELIVERY_PROFILE, Document.DRIVING_LICENCE]

SPECIFIC_DOCUMENTS: dict[str, list[str]] = {
    "Agent immobilier": [Document.PRO_CARD, Document.BUSINESS_REGISTRY],
    "Avocat": [Document.BAR_CARD],
    "Chauffeur VTC": DRIVING,
    "Commerçante": TRADE,
    "Comptable": [Document.ORDER_CARD],
    "Gérant de maquis": TRADE,
    "Infirmière": HEALTH,
    "Livreur": DRIVING,
    "Médecin": HEALTH,
    "Pharmacienne": HEALTH,
    "Restauratrice": TRADE,
    "Enseignant": [Document.PRO_CARD],
    "Transitaire": [Document.PRO_CARD, Document.BUSINESS_REGISTRY],
}

# Many workers of the informal sector have no official paper: the photo at work keeps them in.
ANY_PROFESSION = [Document.WORK_CERTIFICATE, Document.PAYSLIP, Document.WORKPLACE_PHOTO]


def documents_for(profession: str) -> list[str]:
    return SPECIFIC_DOCUMENTS.get(profession, []) + ANY_PROFESSION
