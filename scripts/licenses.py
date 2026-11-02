# Runs inside the backend production image: reads the Node licence list (pnpm JSON) on stdin,
# prints the licence table in Markdown and exits 1 on a forbidden licence or package.
import json
import sys
from importlib.metadata import distributions

DOCKER_IMAGES = [
    ("python:3.13-slim", "PSF-2.0"),
    ("node:22-slim", "MIT"),
    ("postgres:16-alpine", "PostgreSQL"),
    ("ghcr.io/astral-sh/uv", "MIT OR Apache-2.0"),
]


def python_license(dist):
    meta = dist.metadata
    if meta.get("License-Expression"):
        return meta["License-Expression"]
    classifiers = meta.get_all("Classifier") or []
    licenses = [c.split(" :: ")[-1] for c in classifiers if c.startswith("License ::")]
    if licenses:
        return " / ".join(licenses)
    text = meta.get("License") or ""
    if text and "\n" not in text and len(text) < 40:
        return text
    for file in dist.files or []:
        if "LICEN" in file.name.upper():
            lines = [line.strip() for line in file.read_text().splitlines() if line.strip()]
            return lines[0] if lines else "inconnue"
    return "inconnue"


def python_rows():
    rows = {(d.metadata["Name"], d.version, python_license(d)) for d in distributions()}
    return sorted(rows, key=lambda row: row[0].lower())


def node_rows(pnpm_json):
    rows = []
    for license_name, packages in pnpm_json.items():
        for package in packages:
            # The sharp override points at a local stub with no native code.
            local = all("@file+" in path for path in package["paths"])
            version = ", ".join(v for v in package["versions"] if v) or "local"
            rows.append((package["name"], version, license_name, local))
    return sorted(rows, key=lambda row: row[0].lower())


def problems(python, node):
    found = []
    for name, version, license_name in python:
        if "GPL" in license_name.upper() or name.lower().startswith("psycopg"):
            found.append(f"Python {name} {version} ({license_name})")
    for name, version, license_name, local in node:
        forbidden = (name == "sharp" and not local) or name.startswith("@img/sharp-libvips-")
        if "GPL" in license_name.upper() or forbidden:
            found.append(f"Node {name} {version} ({license_name})")
    return found


def table(header, rows):
    lines = [f"| {' | '.join(header)} |", f"|{'---|' * len(header)}"]
    lines += [f"| {' | '.join(row)} |" for row in rows]
    return "\n".join(lines)


def main():
    python = python_rows()
    node = node_rows(json.load(sys.stdin))
    print("# Licences de FirstFan\n")
    print("Composants livrés en production. Le script échoue sur toute licence GPL, LGPL ou AGPL.\n")
    print("## Backend (Python)\n")
    print(table(["Paquet", "Version", "Licence"], python))
    print("\n## Frontend (Node, dépendances de production)\n")
    print(table(["Paquet", "Version", "Licence"], [row[:3] for row in node]))
    print("\n## Images Docker\n")
    print(table(["Image", "Licence"], DOCKER_IMAGES))
    found = problems(python, node)
    for problem in found:
        print(f"Interdit : {problem}", file=sys.stderr)
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
