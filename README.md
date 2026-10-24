# [NOM]

Projet CADEV 2026, groupe Côte d'Ivoire.

[NOM] met en relation des développeurs qui ont un MVP et zéro vrai utilisateur avec des professionnels vérifiés (comptables, restauratrices, commerçants, livreurs...) qui testent leur application pour de vrai. Le testeur suit un parcours guidé et laisse des preuves horodatées. Il est rémunéré après validation, par mobile money. Le dev et le testeur se notent mutuellement. Un petit script mesure ensuite qui utilise encore l'app à J7 et à J30.

Le nom du produit n'est pas encore choisi : `[NOM]` est un marqueur, défini à un seul endroit de chaque côté (`frontend/src/lib/brand.ts` et `PRODUCT_NAME` dans `backend/config/settings.py`).

Ce dépôt contient pour l'instant le socle technique et la page d'accueil animée, branchée sur une vraie API de compteurs publics. Les parcours développeur et testeur viennent ensuite.

## Documents de référence

- `docs/superpowers/specs/2026-10-23-plateforme-futurs-clients-design.md` : conception du produit.
- `docs/superpowers/specs/2026-10-23-landing-spec.md` : spécification de la page d'accueil (textes exacts, système visuel, chorégraphies). C'est la source de vérité, citée par section (`§3.4`, `§5`...).
- `docs/superpowers/plans/2026-10-23-socle-et-landing.md` : plan de réalisation du socle et de la landing.

## Stack

| Partie | Technologies |
|---|---|
| Backend (`backend/`) | Python 3.13, uv, Django 6.1, Django REST framework 3.18, PostgreSQL via `django-pg8000` et `pg8000` |
| Frontend (`frontend/`) | Node 22, pnpm, Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion 14 |
| Base de données | PostgreSQL 16 en Docker (`docker-compose.yml`, port 55432 en local) |
| Tests | pytest et pytest-django ; Vitest, `node --test` et Playwright côté frontend |

En développement, Next réécrit `/api/*` vers Django sur `http://127.0.0.1:8010` (le port 8000 est souvent pris par un autre projet). La landing est rendue côté serveur ; les animations sont des composants client isolés.

## Licences

Aucune dépendance sous licence GPL, AGPL ou LGPL n'est acceptée, ni en production ni en développement.

- **PostgreSQL sans psycopg.** `psycopg` et `psycopg2` sont sous LGPL. Le backend utilise `pg8000` (BSD-3-Clause), un pilote en pur Python, avec le moteur Django `django-pg8000` (MIT). Conséquence à connaître : ce moteur ne gère pas `JSONField` (`supports_json_field = False`), donc les données sont modélisées en tables.
- **Next.js sans sharp.** `sharp` et ses binaires `libvips` sont sous LGPL. `frontend/pnpm-workspace.yaml` remplace `sharp` par un paquet local vide (`frontend/stubs/sharp`, licence MIT) qui lève une erreur s'il est appelé, et `next.config.ts` désactive l'optimisation d'images (`images.unoptimized: true`). La landing n'utilise d'ailleurs aucune image raster hors du grain.
- **Polices** : Archivo, Geist et JetBrains Mono, toutes sous OFL, auto-hébergées par `next/font`.
- **Outils ponctuels.** Lighthouse, utilisé pour les audits, est lancé par `npx` (Apache-2.0) et n'est pas une dépendance du projet.

## Lancer le projet en local

Prérequis : Docker, Python 3.13 avec [uv](https://docs.astral.sh/uv/), Node 22 avec pnpm.

```bash
# 1. Base de données
docker compose up -d db

# 2. Backend : dépendances, migrations, données de démo, serveur
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py seed_demo      # testeurs de démo, idempotent (voir plus bas)
uv run python manage.py runserver 127.0.0.1:8010

# 3. Frontend (dans un autre terminal)
cd frontend
pnpm install
pnpm dev                               # http://localhost:3000
```

Variables d'environnement utiles :

- Backend : `DATABASE_HOST`, `DATABASE_PORT` (55432 par défaut), `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DEMO_MODE` (vrai par défaut), `PRODUCT_NAME`.
- Frontend : `API_INTERNAL_URL` (adresse de Django vue par le serveur Next, `http://127.0.0.1:8010` par défaut).

### Données de démo

Tant que `DEMO_MODE` est vrai, l'API publique renvoie `demo: true` et la page affiche « Données de démo CADEV ». La commande `seed_demo` crée douze testeurs de démonstration (dix vérifiés), avec des identifiants fixes `demo-testeur-NN` et sans mot de passe utilisable : la relancer ne crée rien de plus. Elle refuse de tourner hors mode démo sans `--force`.

Aucun chiffre n'est inventé côté frontend. Les compteurs « tests en cours » et « apps testées » restent à 0 tant que les campagnes de test n'existent pas dans le modèle.

## Tests

```bash
cd backend && uv run pytest -q
cd frontend && node --test scripts/ && pnpm vitest run && pnpm playwright test && pnpm build
```

Le détail des tests frontend (Playwright, garde-fou de contenu) est dans `frontend/README.md`.

## Arborescence

```
backend/    Django : config/, accounts/ (utilisateurs à rôles, profils testeurs), public/ (compteurs publics), core/ (santé)
frontend/   Next.js : src/app/ (page, API de relais), src/components/landing/ (sections de la landing), e2e/, scripts/
docs/       spécifications et plans
```
