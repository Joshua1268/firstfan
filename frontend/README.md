# Frontend [NOM]

Page d'accueil de [NOM] : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 et Motion 14. La page est rendue côté serveur ; les compteurs viennent de l'API Django (`GET /api/public/stats/`).

La spécification de référence est `../docs/superpowers/specs/2026-10-23-landing-spec.md`. Les sections y sont citées dans le code par leur numéro (`§3.4`, `§6`...).

## Démarrer en développement

Prérequis : Node 22, pnpm, et le backend Django lancé sur `127.0.0.1:8010` (voir le `README.md` à la racine).

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Next réécrit `/api/*` vers Django. Pour pointer ailleurs, définir `API_INTERNAL_URL` (par défaut `http://127.0.0.1:8010`). Si l'API ne répond pas, la page se rend quand même et masque les compteurs.

Build de production :

```bash
pnpm build && pnpm start -p 3100
```

`NEXT_DIST_DIR` permet de produire un second build dans un autre dossier (Playwright s'en sert pour le scénario « API arrêtée »).

## Organisation

```
src/app/                        layout (polices, MotionConfig), page (composition serveur),
                                globals.css (tokens §5, grain, keyframes)
src/app/api/public/stats/       relais des compteurs publics
src/components/landing/         Nav, Hero, Stickers, LiveBadge, JobsMarquee, ProSection, LiveSection,
                                WhatIs, Trust, DevExchange, FinalCta, Footer, MobileCtaBar
src/components/landing/stage/   stage « Boucle et histoire » : un seul useScroll lissé, scènes, repli statique
src/lib/                        brand.ts (PRODUCT_NAME), motion-tokens.ts (durées, easings, springs §6), stats.ts
e2e/                            tests Playwright de la landing
scripts/                        garde-fou de contenu et ses tests
stubs/sharp/                    paquet vide qui remplace sharp (licence LGPL refusée)
```

Règles de motion appliquées partout : on n'anime que `transform`, `opacity`, `pathLength` / `stroke-dashoffset` et `offset-distance` ; chaque animation a un état final en `prefers-reduced-motion: reduce` ; tout le texte est dans le HTML serveur.

## Performance

Mesures Lighthouse 12 (Chrome headless, build de production servi en local, octobre 2026) : desktop Perf 100, LCP 0,7 s, CLS 0 ; mobile Perf 92 à 93, Accessibilité et Bonnes pratiques 100, CLS 0.

Écart connu et accepté : le LCP mobile en mode simulé (celui de PageSpeed, 4G lente et CPU x4 estimés par Lantern) est de 3,2 à 3,3 s, au-dessus de la cible de 2,5 s. Le LCP réellement observé est d'environ 0,1 s, et de 1,6 s avec le même étranglement appliqué pour de vrai (`--throttling-method=devtools`). L'élément LCP est le sous-titre du hero, peint dès la première image ; l'estimation compte surtout le JavaScript demandé avant lui (React, runtime Next, Motion : environ 215 Ko gzip). Le stage animé est déjà sorti du chargement initial (chunk chargé à l'inactivité ou à l'approche du stage, jamais en reduced-motion).

## Tests

```bash
pnpm test                   # garde-fou de contenu (node --test scripts/*.test.mjs) puis vitest
pnpm vitest run             # tests unitaires seuls (géométrie du stage, seuils, stats, URL d'API)
pnpm playwright test        # tests de bout en bout
pnpm build                  # build de production
```

### Playwright

Avant de lancer Playwright, la base Postgres doit tourner et être migrée :

```bash
docker compose -f ../docker-compose.yml up -d db
(cd ../backend && uv run python manage.py migrate)
```

`playwright.config.ts` démarre (ou réutilise) trois serveurs : Django sur 8010, un build de production sur 3100, et un second build sur 3101 dont l'API pointe vers un port fermé (projet `api-down`). Les projets couvrent desktop 1440x900, mobile 375x812, tablette 820x1180, grand écran 1920x1080, laptop 1280x800 et petit laptop 1024x768.

Attention : avec `reuseExistingServer`, un serveur Next resté ouvert sur 3100 ou 3101 depuis un ancien build est réutilisé tel quel. Vérifier avec `lsof -nP -iTCP:3100,3101 -sTCP:LISTEN` et l'arrêter avant de tester du code modifié.

### Garde-fou de contenu

`scripts/check-content.mjs` refuse dans la landing :

- les montants (chiffres suivis d'une devise : FCFA, CFA, XOF, F, k, euros...) ;
- les emojis (les repères visuels sont des icônes SVG) ;
- les flèches en caractère Unicode (U+2190 à U+21FF, U+27F0 à U+27FF, U+2900 à U+297F) ;
- les mots « premier », « première », « premiers », « premières ».

```bash
pnpm check:content                   # analyse src/components/landing
node scripts/check-content.mjs <dir> # analyse un autre dossier ou un fichier HTML rendu
```

Le même contrôle tourne dans Playwright sur le texte rendu de la page (`rendered page has no forbidden content`).
