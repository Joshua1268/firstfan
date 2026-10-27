import hashlib
from datetime import UTC

from django.conf import settings

from .models import Project


def compute_fingerprint(name: str, url: str, description: str, capture_hashes: list[str]) -> str:
    content = "\n".join([name, url, description, *capture_hashes])
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def render_certificate(project: Project) -> str:
    owner = project.owner
    date = project.fingerprinted_at.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    captures = [f"  {c.order}. {c.sha256}" for c in project.captures.all()] or ["  aucune"]
    lines = [
        f"Certificat d'antériorité {settings.PRODUCT_NAME}",
        "",
        f"Projet : {project.name}",
        f"URL : {project.url}",
        f"Description : {project.description}",
        f"Propriétaire : {owner.first_name} <{owner.email}>",
        f"Date (UTC) : {date}",
        f"Empreinte SHA-256 : {project.fingerprint}",
        "Empreintes SHA-256 des captures :",
        *captures,
        "",
        "Méthode : l'empreinte est le SHA-256 du texte UTF-8 formé du nom, de l'URL, de la description "
        "et des empreintes des captures, dans cet ordre, séparés par un retour à la ligne.",
    ]
    return "\n".join(lines) + "\n"
