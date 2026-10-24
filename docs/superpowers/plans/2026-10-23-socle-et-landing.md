# Socle et page d'accueil : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le socle Next.js + Django/DRF et livrer la page d'accueil animée complète, branchée sur une vraie API de compteurs publics.

**Architecture:** Monorepo `cadev-2026/` avec deux dossiers :
- `backend/` : Django 6.1 + DRF, PostgreSQL via `django-pg8000`, utilisateur personnalisé à rôles.
- `frontend/` : Next.js 16 App Router + TypeScript + Tailwind 4 + Motion 14.

En dev, Next réécrit `/api/*` vers Django (`http://127.0.0.1:8010` ; le port 8000 est souvent déjà pris par un autre projet). La landing est rendue côté serveur. Les animations sont des composants client isolés.

**Tech Stack:**
- Backend : Python 3.13, uv, Django 6.1.2, djangorestframework 3.18.3, django-pg8000 0.0.5, pg8000 1.31.5, pytest-django 4.14.
- Frontend : Node 22, pnpm, next 16.4.3, react 19, motion 14.6, tailwindcss 4.3, vitest 5, @playwright/test 1.64.
- Base : PostgreSQL 16 en Docker.

**Spec:**
- `docs/superpowers/specs/2026-10-23-plateforme-futurs-clients-design.md` (produit)
- `docs/superpowers/specs/2026-10-23-landing-spec.md` (landing ; source de vérité pour les textes exacts, les tokens et les chorégraphies, citée par section `§x.y`)

## Global Constraints

- Aucun composant GPL, AGPL ou LGPL.
  - Interdit : `psycopg`, `psycopg2`, `psycopg-binary`, `sharp`, `@img/sharp-libvips-*`.
  - `sharp` est neutralisé par `pnpm.overrides` vers un paquet vide local ; `images.unoptimized: true`.
- `django-pg8000` ne supporte pas `JSONField` (`supports_json_field = False`). Aucun `JSONField` : on modélise en tables.
- Aucun montant chiffré sur la landing.
  - Interdit : regex `/\d[\d\s.,]*\s?(F|FCFA|XOF|CFA|francs?)\b/i` et tout `[\d]+\s?(k|K)\s?F`.
  - Les prix n'apparaissent que dans l'espace connecté (hors de ce plan).
- Aucun emoji. Aucune flèche Unicode (U+2190 à U+21FF, U+27F0 à U+27FF) dans le texte rendu : les flèches sont des icônes SVG.
- Le mot « premier » (et « première », « premiers ») n'apparaît pas dans la landing.
- Les chiffres en direct ne sont jamais écrits en dur : ils viennent de `GET /api/public/stats/`. Si `demo` est vrai, l'étiquette est « Données de démo CADEV ».
- Nom du produit : constante unique `PRODUCT_NAME = "[NOM]"` dans `frontend/src/lib/brand.ts` et `backend/config/settings.py` (`PRODUCT_NAME`). Elle sera remplacée quand le nom sera choisi.
- Langue : français. Pas de commentaires superflus. Commits sans trailer `Co-Authored-By`.
- Respect de `prefers-reduced-motion` : `<MotionConfig reducedMotion="user">` à la racine. Chaque section a un état final statique (§ « Reduced-motion » de chaque section).
- Animations limitées à `transform`, `opacity`, `stroke-dashoffset`/`pathLength` et `offset-distance`. Jamais `filter`, `box-shadow`, `width` ou `height` animés.

## Review Focus

1. **Téléphone en 375 × 812 :**
   - aucun défilement horizontal ;
   - aucun autocollant ne recouvre le H1 ni les CTA ;
   - le CTA testeur passe en premier.
   Test : `e2e/landing.spec.ts › mobile layout` (Task 4).
2. **`prefers-reduced-motion: reduce` :** toutes les sections affichent leur état final, et le texte de chaque scène du stage est lisible sans scroller dans le stage. Test : `e2e/landing.spec.ts › reduced motion` (Task 7).
3. **API Django arrêtée ou lente :** la page se rend quand même, sans erreur 500 et sans « 0 » qui clignote ; les compteurs sont masqués. Test : `frontend/src/lib/stats.test.ts › returns null on network error` (Task 3) et `e2e › api down` (Task 7).
4. **Remontée rapide dans le stage, ou saut par la barre de crans :** les animations déclenchées par seuil s'inversent ; aucune scène ne reste à moitié affichée. Test : `e2e/landing.spec.ts › stage jump back` (Task 6).
5. **JavaScript désactivé :** H1, sous-texte, CTA et textes de toutes les sections sont présents dans le HTML. Test : `e2e/landing.spec.ts › no js` (Task 7).

---

## Structure des fichiers

```
cadev-2026/
  .gitignore  .editorconfig  README.md  docker-compose.yml (postgres dev)
  backend/
    pyproject.toml  uv.lock  manage.py  pytest.ini
    config/ settings.py urls.py wsgi.py asgi.py
    accounts/ models.py admin.py apps.py migrations/ tests/test_models.py
    public/ views.py services.py urls.py tests/test_stats.py
    core/ views.py (health) tests/test_health.py
  frontend/
    package.json  pnpm-lock.yaml  next.config.ts  tsconfig.json  postcss.config.mjs
    vitest.config.ts  playwright.config.ts
    stubs/sharp/package.json  stubs/sharp/index.js
    scripts/check-content.mjs  scripts/check-content.test.mjs
    src/app/layout.tsx  src/app/page.tsx  src/app/globals.css
    src/lib/brand.ts  src/lib/stats.ts  src/lib/stats.test.ts  src/lib/motion-tokens.ts
    src/components/landing/
      Nav.tsx  Hero.tsx  Stickers.tsx  LiveBadge.tsx  JobsMarquee.tsx
      stage/Stage.tsx  stage/StoryCard.tsx  stage/Loop.tsx  stage/Break.tsx
      stage/TwoVoices.tsx  stage/Steps.tsx  stage/Curves.tsx  stage/StageNav.tsx
      ProSection.tsx  LiveSection.tsx  WhatIs.tsx  Trust.tsx  DevExchange.tsx
      FinalCta.tsx  Footer.tsx  MobileCtaBar.tsx  icons.tsx
    e2e/landing.spec.ts
```

---

### Task 1 : Socle backend Django + PostgreSQL via pg8000

**Files:**
- Create: `.gitignore`, `.editorconfig`, `docker-compose.yml`, `backend/pyproject.toml`, `backend/manage.py`, `backend/pytest.ini`, `backend/config/*`, `backend/accounts/*`, `backend/core/*`
- Test: `backend/accounts/tests/test_models.py`, `backend/core/tests/test_health.py`

**Interfaces:**
- Produces:
  - `accounts.User(AbstractUser)` avec le champ `role` (TextChoices `Role.DEV="dev"`, `Role.TESTER="tester"`, `Role.ADMIN="admin"`, défaut `dev`).
  - `accounts.TesterProfile(user: OneToOne, profession: CharField(120), city: CharField(80, blank), linkedin_url: URLField(blank), proof: FileField(upload_to="proofs/", blank), verification: TextChoices PENDING/VERIFIED/REJECTED, défaut PENDING, verified_at: DateTimeField(null), rating_avg: DecimalField(3,2, null))`.
  - `AUTH_USER_MODEL = "accounts.User"`.
  - `GET /api/health/` renvoie `{"status": "ok", "db": true}`.

- [ ] **Step 1 : Initialiser le dépôt et la base**
  - `git init` dans `cadev-2026/`.
  - `docker-compose.yml` avec le service `db` (`postgres:16-alpine`, port `55432:5432`, base `cadev`, utilisateur `cadev`, mot de passe `cadev`, volume nommé).
  - `.gitignore` couvre `.venv`, `node_modules`, `.next`, `media/` et `.env`.
- [ ] **Step 2 : Créer le projet Django**
  - `uv init --app backend` et `uv add django==6.1.2 djangorestframework==3.18.3 django-pg8000==0.0.5 pg8000==1.31.5`.
  - `uv add --dev pytest pytest-django`.
  - `django-admin startproject config backend`, puis les apps `accounts`, `core` et `public`.
  - Les réglages viennent de l'environnement (`os.environ.get`) : `DATABASE_*`, `SECRET_KEY`, `DEBUG`, `DEMO_MODE` (défaut `True`), `PRODUCT_NAME`.
  - `ENGINE = "django_pg8000"`, `LANGUAGE_CODE = "fr"`, `TIME_ZONE = "Africa/Abidjan"`.
- [ ] **Step 3 : Écrire les tests en échec**

```python
# accounts/tests/test_models.py
def test_user_default_role_is_dev(db):
    u = User.objects.create_user("awa", "awa@x.ci", "pw-123456")
    assert u.role == User.Role.DEV

def test_tester_profile_starts_pending(db):
    u = User.objects.create_user("koffi", "k@x.ci", "pw-123456", role=User.Role.TESTER)
    p = TesterProfile.objects.create(user=u, profession="Comptable")
    assert p.verification == TesterProfile.Verification.PENDING and p.verified_at is None

# core/tests/test_health.py
def test_health_reports_db(client, db):
    r = client.get("/api/health/")
    assert r.status_code == 200 and r.json() == {"status": "ok", "db": True}
```

- [ ] **Step 4 : Lancer `cd backend && uv run pytest -q`**
  - Attendu : échec (modèles et route absents).
- [ ] **Step 5 : Implémenter**
  - Les modèles des Interfaces.
  - `admin.py`, qui enregistre `User` et `TesterProfile` :
    - `list_display` : `user`, `profession`, `verification` ;
    - action d'admin `marquer_verifie`, qui pose `VERIFIED` et `verified_at=now()`.
  - La vue `health`, qui exécute `SELECT 1`.
- [ ] **Step 6 : Relancer `docker compose up -d db && cd backend && uv run python manage.py makemigrations && uv run pytest -q`**
  - Attendu : 3 tests passent.
  - Vérifier aussi `uv pip list | grep -i psycopg` : aucune sortie.
- [ ] **Step 7 : Commit** : `feat(backend): socle Django, utilisateurs a roles, profil testeur`

### Task 2 : API publique des compteurs

**Files:**
- Create: `backend/public/services.py`, `backend/public/views.py`, `backend/public/urls.py`
- Test: `backend/public/tests/test_stats.py`

**Interfaces:**
- Consumes : `TesterProfile` (Task 1).
- Produces :
  - `get_public_stats() -> dict[str, int | bool]` renvoie les clés `tests_in_progress`, `verified_testers`, `apps_tested`, `demo`.
  - `GET /api/public/stats/` renvoie ce dict, avec l'en-tête `Cache-Control: public, max-age=15`, sans authentification.
  - Tant que les campagnes n'existent pas, `tests_in_progress` et `apps_tested` valent 0.
  - `verified_testers` compte les `TesterProfile` dont `verification == VERIFIED`.
  - `demo` vaut `settings.DEMO_MODE`.

- [ ] **Step 1 : Écrire les tests en échec**

```python
def test_stats_counts_only_verified_testers(client, db):
    make_tester("a", TesterProfile.Verification.VERIFIED)
    make_tester("b", TesterProfile.Verification.PENDING)
    r = client.get("/api/public/stats/")
    assert r.status_code == 200
    assert r.json() == {"tests_in_progress": 0, "verified_testers": 1, "apps_tested": 0, "demo": True}
    assert "max-age=15" in r["Cache-Control"]

def test_stats_never_exposes_amounts(client, db):
    assert not any(k for k in client.get("/api/public/stats/").json() if "amount" in k or "fcfa" in k)
```

- [ ] **Step 2 : Lancer `uv run pytest public -q`**
  - Attendu : échec.
- [ ] **Step 3 : Implémenter** le service, la vue DRF `APIView` (`permission_classes = [AllowAny]`) et la route.
- [ ] **Step 4 : Relancer `uv run pytest -q`**
  - Attendu : tous les tests passent.
- [ ] **Step 5 : Commit** : `feat(api): compteurs publics de la landing`

### Task 3 : Socle frontend, design system et garde-fous de contenu

**Files:**
- Create : tous les fichiers de configuration `frontend/*`, plus `stubs/sharp/*`, `scripts/check-content.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/brand.ts`, `src/lib/stats.ts` et `src/lib/motion-tokens.ts`.
- Test : `scripts/check-content.test.mjs` et `src/lib/stats.test.ts`.

**Interfaces:**
- Produces :
  - `PRODUCT_NAME: string` (`brand.ts`).
  - `type PublicStats = { tests_in_progress: number; verified_testers: number; apps_tested: number; demo: boolean }`.
  - `fetchPublicStats(): Promise<PublicStats | null>` (`stats.ts`). Côté serveur : `fetch(process.env.API_INTERNAL_URL + "/api/public/stats/", { next: { revalidate: 15 } })`, avec un timeout de 1500 ms via `AbortSignal.timeout`. Renvoie `null` sur toute erreur.
  - `motion-tokens.ts` exporte les tokens de §6 de la spec landing : `dur` (durées en ms), `ease` (tableaux cubic-bezier), `spring` (objets `{ stiffness, damping, mass? }`), dont `spring.stamp = { stiffness: 650, damping: 22, mass: 0.8 }`.
  - Les tokens CSS de §5 (couleurs, échelle typographique, rayons) sont posés sur `:root` dans `globals.css` et exposés à Tailwind 4 via `@theme`.
  - `layout.tsx` charge Archivo (variable, axe `wdth`), Geist et JetBrains Mono via `next/font/google`, et enveloppe la page dans `<MotionConfig reducedMotion="user">` (composant client `Providers`).
  - `node scripts/check-content.mjs <dir>` sort en code 1 en listant `fichier:ligne:motif` pour les montants, les emojis (`\p{Extended_Pictographic}`), les flèches Unicode et `premi(er|ère|ers|ères)`, sur `src/components/landing/**` et le HTML rendu passé en argument.

- [ ] **Step 1 : Créer l'app**
  - `pnpm create next-app frontend --ts --app --src-dir --tailwind --eslint --use-pnpm --no-import-alias`.
  - `pnpm add motion@14.6.0`.
  - `pnpm add -D vitest @playwright/test`.
- [ ] **Step 2 : Neutraliser sharp**
  - `stubs/sharp/package.json` contient `{"name":"sharp","version":"0.0.0-stub","license":"MIT","main":"index.js"}`, et `index.js` lève `throw new Error("sharp désactivé (licence LGPL)")`.
  - Dans `package.json` : `"pnpm": {"overrides": {"sharp": "file:./stubs/sharp"}}`.
  - Dans `next.config.ts` : `images: { unoptimized: true }`, et `rewrites` de `/api/:path*` vers `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8010"}/api/:path*` (constante partagée `DEFAULT_API_URL` dans `src/lib/api-url.ts`).
- [ ] **Step 3 : Écrire les tests en échec**

```js
// scripts/check-content.test.mjs (node --test)
test("flags amounts", () => assert.deepEqual(scan("Gagne 5 000 FCFA").map(f => f.rule), ["amount"]))
test("flags 5000f", () => assert.equal(scan("5000f par test")[0].rule, "amount"))
test("flags premier", () => assert.equal(scan("Le premier en Afrique")[0].rule, "premier"))
test("flags unicode arrow", () => assert.equal(scan("Voir →")[0].rule, "arrow"))
test("flags emoji", () => assert.equal(scan("Top \u{1F680}")[0].rule, "emoji"))
test("passes clean copy", () => assert.deepEqual(scan("Testeurs payés après validation, par Wave."), []))
test("J7 and 4,8 / 5 are not amounts", () => assert.deepEqual(scan("Toujours là à J7 · 4,8 / 5 · 14 captures"), []))
```

```ts
// src/lib/stats.test.ts (vitest, fetch mocké)
it("returns parsed stats", async () => { mockFetch({ tests_in_progress: 2, verified_testers: 5, apps_tested: 1, demo: true }); expect(await fetchPublicStats()).toEqual({ tests_in_progress: 2, verified_testers: 5, apps_tested: 1, demo: true }) })
it("returns null on network error", async () => { mockFetchReject(); expect(await fetchPublicStats()).toBeNull() })
it("returns null on non-200", async () => { mockFetch({}, 503); expect(await fetchPublicStats()).toBeNull() })
```

- [ ] **Step 4 : Lancer `pnpm test`**
  - Attendu : échec.
- [ ] **Step 5 : Implémenter**
  - `check-content.mjs`, qui exporte `scan(text): {rule, match, index}[]` et a une CLI.
  - `stats.ts`, `brand.ts`, `motion-tokens.ts`, les tokens de `globals.css`, `layout.tsx` (polices et `Providers`).
  - `src/app/page.tsx` : page provisoire qui rend `PRODUCT_NAME`.
- [ ] **Step 6 : Vérifier**
  - Relancer les tests : ils passent.
  - `pnpm build` réussit.
  - `pnpm why sharp` montre uniquement `0.0.0-stub`.
  - `grep -r "LGPL" node_modules/.pnpm/*/node_modules/*/package.json` ne renvoie rien.
- [ ] **Step 7 : Commit** : `feat(web): socle Next.js, tokens, garde-fous contenu et licences`

### Task 4 : Nav, Hero, autocollants, badge en direct, barre CTA mobile

**Files:**
- Create : `Nav.tsx`, `Hero.tsx`, `Stickers.tsx`, `LiveBadge.tsx`, `MobileCtaBar.tsx` et `icons.tsx` (flèche, chevron, coche, étoile, menu), dans `src/components/landing/`.
- Modify : `src/app/page.tsx` (composition serveur ; appelle `fetchPublicStats()` et passe `stats` en props).
- Test : `e2e/landing.spec.ts` (créé ici) et `playwright.config.ts`.
  - Projets `desktop` (1440 × 900) et `mobile` (375 × 812, `isMobile`).
  - `webServer` : `pnpm build && pnpm start` sur le port 3100.

**Interfaces:**
- Consumes : `PublicStats | null`, `motion-tokens`, `PRODUCT_NAME`.
- Produces :
  - `<Hero stats={PublicStats | null} />` ;
  - `<Stickers />` (client, `next/dynamic` `ssr:false`, emplacements réservés) ;
  - `<LiveBadge value={number | null} demo={boolean} />` (ne rend rien si `value === null`) ;
  - attribut `data-camp="dev" | "pro"` sur les CTA et les autocollants, qui pilote l'effet de survol (§3.2).
- Textes, autocollants (8 sur desktop, 5 sur mobile), timings, springs, parallaxe et zones d'exclusion : §2, §3.1 et §3.2 de la spec landing, à l'identique.

- [ ] **Step 1 : Écrire les tests e2e en échec**

```ts
test("hero copy is server-rendered and CTAs are clickable", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tes futurs clients testent ton app\./i)
  await expect(page.getByRole("link", { name: "Je suis développeur" }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: "Je teste et je suis rémunéré" }).first()).toBeVisible()
})
test("mobile layout", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile")
  await page.goto("/"); await page.waitForTimeout(1600)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const h1 = await page.getByRole("heading", { level: 1 }).boundingBox()
  for (const s of await page.locator("[data-sticker]").all()) expect(overlaps(await s.boundingBox(), h1)).toBe(false)
  const ctas = page.locator("[data-hero-cta]"); await expect(ctas.first()).toHaveAttribute("data-camp", "pro")
})
test("rendered page has no forbidden content", async ({ page }) => {
  await page.goto("/"); expect(scan(await page.locator("body").innerText())).toEqual([])
})
```

- [ ] **Step 2 : Lancer `pnpm playwright test`**
  - Attendu : échec.
- [ ] **Step 3 : Implémenter les composants** selon §3.1 et §3.2.
  - L'entrée du H1 se fait en CSS keyframes (pas de JS). Le texte du hero est à opacité 1 dans le HTML.
- [ ] **Step 4 : Relancer**
  - Attendu : les tests passent sur les deux projets.
- [ ] **Step 5 : Vérification visuelle (Chrome DevTools MCP)**
  - Prendre des captures à 0, 600, 1300 et 3000 ms, sur desktop et sur mobile.
  - Comparer au tableau §2, puis corriger les écarts.
- [ ] **Step 6 : Commit** : `feat(landing): hero, autocollants, badge en direct`

### Task 5 : Bandeau métiers

**Files:** Create `JobsMarquee.tsx`. Modify `page.tsx`. Test `e2e/landing.spec.ts`.

**Interfaces:** `<JobsMarquee />`, avec la liste et les textes de §3.3. Le mini-tampon passe par un intervalle stoppé hors écran (`useInView`) et quand `document.hidden` est vrai.

- [ ] **Step 1 : Test en échec**
  - `test("jobs marquee lists verified jobs")` : le texte « MÉTIERS VÉRIFIÉS SUR » et « Comptable » est visible.
  - Avec `page.emulateMedia({ reducedMotion: "reduce" })`, l'élément `[data-marquee-track]` a l'animation `none`.
- [ ] **Step 2 : Lancer** : échec.
- [ ] **Step 3 : Implémenter** selon §3.3 (marquee CSS sur 40 s, contenu doublé, `mask-image` sur les bords).
- [ ] **Step 4 : Relancer** : les tests passent.
- [ ] **Step 5 : Commit** : `feat(landing): bandeau metiers verifies`

### Task 6 : Stage « Boucle et histoire » (cœur de la page)

**Files:** Create `stage/*.tsx`. Modify `page.tsx`. Test `e2e/landing.spec.ts`.

**Interfaces:**
- `<Stage />` (client) :
  - un seul `useScroll({ target, offset: ["start start", "end end"] })` ;
  - `p = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.0005 })` ;
  - hauteur 480vh sur desktop, 360vh sur mobile ;
  - attribut `data-scene` sur le stage, parmi `loop|break|voices|step1|step2|step3|step4` ;
  - plages de `p` : §3.4.
- Sous-composants, qui reçoivent tous `p: MotionValue<number>` :
  - `<StoryCard p />` : un seul `motion.div`, couches grise et couleur, preuves enfants, jalons §3.4 ;
  - `<Loop p />` ;
  - `<Break p />` : moment signature, §4 complet ;
  - `<TwoVoices p />` ;
  - `<Steps p />` ;
  - `<Curves p />` ;
  - `<StageNav p onJump={(scene) => void} />` (5 crans, plus le lien « Passer l'histoire » vers `#pro`).
- Les micro-chorégraphies déclenchées par seuil passent par `useMotionValueEvent(p, "change")` et s'inversent sous le seuil.
- En mode reduced-motion, le stage n'est plus sticky : les sept scènes sont empilées et statiques, dans leur état final.

- [ ] **Step 1 : Tests en échec**

```ts
test("stage scenes advance with scroll", async ({ page }) => {
  await page.goto("/"); const stage = page.locator("[data-stage]")
  await scrollStageTo(page, 0.05); await expect(stage).toHaveAttribute("data-scene", "loop")
  await scrollStageTo(page, 0.40); await expect(stage).toHaveAttribute("data-scene", "step1")
  await scrollStageTo(page, 0.92); await expect(stage).toHaveAttribute("data-scene", "step4")
})
test("stage jump back", async ({ page }) => {
  await page.goto("/"); await scrollStageTo(page, 0.92)
  await page.getByRole("button", { name: "Boucle" }).click(); await page.waitForTimeout(1200)
  await expect(page.locator("[data-stage]")).toHaveAttribute("data-scene", "loop")
  await expect(page.locator("[data-scene-text]")).toHaveCount(1)
})
test("skip story link goes to pro section", async ({ page }) => {
  await page.goto("/"); await page.getByRole("link", { name: "Passer l'histoire" }).click()
  await expect(page.locator("#pro")).toBeInViewport()
})
```

- [ ] **Step 2 : Lancer** : échec.
- [ ] **Step 3 : Implémenter les scènes, dans l'ordre**
  1. A (Loop).
  2. B (Break), d'après §4 : préparation, séquence, performance.
  3. C (TwoVoices).
  4. D, E, F (Steps).
  5. G (Curves, le duel des courbes de §4).
  6. StageNav.
  - Textes exacts et visuels : §3.4.
- [ ] **Step 4 : Relancer** : les tests passent.
- [ ] **Step 5 : Vérification de la performance (Chrome DevTools MCP)**
  - Faire une trace de performance pendant un scroll complet du stage sur desktop.
  - Aucune frame longue de plus de 50 ms ne doit venir du stage.
  - Prendre des captures à p = 0.05, 0.19, 0.27, 0.40, 0.56, 0.72 et 0.92, puis corriger les écarts avec la spec.
- [ ] **Step 6 : Commit** : `feat(landing): stage boucle cassee et histoire en 4 etapes`

### Task 7 : Sections pro, en direct, c'est quoi, confiance, entre devs, CTA final, footer

**Files:** Create `ProSection.tsx`, `LiveSection.tsx`, `WhatIs.tsx`, `Trust.tsx`, `DevExchange.tsx`, `FinalCta.tsx` et `Footer.tsx`. Modify `page.tsx`. Test `e2e/landing.spec.ts`.

**Interfaces:**
- `<ProSection />` porte l'ancre `id="pro"`.
- `<LiveSection stats={PublicStats | null} />` :
  - rafraîchit les compteurs par polling de `/api/public/stats/` toutes les 15 s (pas de SSE dans ce plan), en pause quand l'onglet est caché ;
  - odomètre sur les changements réels uniquement ;
  - étiquette « Données de démo CADEV » si `demo` ;
  - si `stats` vaut `null`, la section rend son texte sans les compteurs.
- Le fil d'événements de §3.6 est remplacé, dans ce plan, par trois cartes d'étapes statiques. Il sera branché quand les événements de campagne existeront (plan suivant) ; marqué `TODO(plan-campagnes)` dans le code.
- Textes et motion : §3.5 à §3.11.

- [ ] **Step 1 : Tests en échec**

```ts
test("reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/")
  for (const t of ["Tu connais la boucle", "Et si on cassait la boucle ?", "Des pros de ton métier cible. Vérifiés."])
    await expect(page.getByText(t, { exact: false }).first()).toBeVisible()
})
test("no js", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage(); await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(page.locator("#pro")).toContainText(/métier/i)
})
test("api down", async ({ page }) => {
  await page.route("**/api/public/stats/**", r => r.abort()); const res = await page.goto("/")
  expect(res?.status()).toBe(200); await expect(page.locator("[data-live-counter]")).toHaveCount(0)
})
test("demo label when demo", async ({ page }) => { await page.goto("/"); await expect(page.getByText("Données de démo CADEV").first()).toBeVisible() })
```

- Pour `api down`, la page est servie par `pnpm start` avec `API_INTERNAL_URL=http://127.0.0.1:9` dans un projet Playwright dédié `api-down`.

- [ ] **Step 2 : Lancer** : échec.
- [ ] **Step 3 : Implémenter les sections** selon §3.5 à §3.11.
- [ ] **Step 4 : Relancer**
  - Attendu : toute la suite e2e passe, plus `node scripts/check-content.mjs src/components/landing`.
- [ ] **Step 5 : Commit** : `feat(landing): sections pro, en direct, confiance, entre devs, CTA final`

### Task 8 : Finition, Lighthouse et revue visuelle complète

**Files:** Modify selon les constats. Create `frontend/README.md` (lancer le projet en dev) et le `README.md` racine (vue d'ensemble).

- [ ] **Step 1 : Lighthouse**
  - Lancer `lighthouse_audit` (Chrome DevTools MCP) sur `/`, en mobile puis en desktop, avec le build de production.
  - Cibles : Performance ≥ 90, Accessibilité ≥ 95, Bonnes pratiques ≥ 95. LCP < 2,5 s, CLS < 0,05.
- [ ] **Step 2 : Revue visuelle**
  - Faire défiler toute la page en desktop (1440) et en mobile (375), avec des captures par section.
  - Vérifier l'absence de chevauchement, de texte coupé et de contraste insuffisant. Vérifier la cohérence avec §5 et §6.
- [ ] **Step 3 : Accessibilité clavier**
  - L'ordre de tabulation suit la page. Le focus est visible avec un anneau accent.
  - Les crans du stage sont atteignables au clavier.
- [ ] **Step 4 : Vérification finale**
  - Lancer `cd backend && uv run pytest -q`, puis `cd frontend && pnpm test && pnpm playwright test && pnpm build`.
  - Attendu : tout est vert.
- [ ] **Step 5 : Commit** : `chore(landing): finition perf, accessibilite et revue visuelle`

---

## Plans suivants (hors de ce plan)

1. Parcours développeur : projets, campagnes, scénario, certificat d'antériorité, choix des testeurs, paiement simulé.
2. Parcours testeur : profil, vérification, invitations, engagement de confidentialité, test guidé avec preuves, avis, notation dans les deux sens.
3. Script de suivi et tableau d'adoption J1/J7/J30, puis branchement du fil d'événements de la landing.
4. Échange entre devs avec crédits, parrainage.
5. Déploiement Datacloud (Caddy, HTTPS), audit des licences, déclarations CADEV.
