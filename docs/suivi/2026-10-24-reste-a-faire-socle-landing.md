# Reste à faire après le socle et la landing

Issu de la revue finale de la branche feat/socle-landing (24/10). Les points déjà corrigés dans la vague finale (réécriture /api, réglages de prod, DRF par défaut, compteurs à zéro, pages manquantes, tests sur petites machines) ne figurent plus ici.

## Avant la mise en ligne (plan déploiement)

- La réécriture Next vers `API_INTERNAL_URL` (127.0.0.1) envoie probablement l'hôte 127.0.0.1 : l'autoriser dans `ALLOWED_HOSTS` ou transmettre l'en-tête Host, sinon /api/* répond 400 en production.
- `DEMO_MODE` : décider la valeur en production et purger les comptes `demo-testeur-NN` si on passe à faux.
- `NUM_PROXIES=1` derrière Caddy : la limite de débit peut regrouper les visiteurs passant par la réécriture Next.
- Valider le texte provisoire de /confidentialite et fixer `NEXT_PUBLIC_CONTACT_EMAIL` une fois le domaine choisi.

## Tri des points mis de côté


| Source | Point | Classement | Raison |
|---|---|---|---|
| Ruling pré-vol | T1 saute git init / .gitignore | drop | fait, sans effet |
| Ruling pré-vol | regex montants avec `u` et `(?!\p{L})` | drop | appliqué, testé, scan e2e en filet |
| Ruling pré-vol | webServer en tableau (Django + Next) | drop | appliqué, fonctionne |
| Ruling T1 | re-revue du fix par le contrôleur | drop | couvert par cette revue |
| T1 | ALLOWED_HOSTS `*`, DEBUG vrai, SECRET_KEY par défaut | fix-later (plan déploiement, bloquant pour la mise en ligne) | voir Important 2 : ajouter un garde fail-closed |
| T1 | MAILERS sans effet | drop | c'est le défaut de `startproject` de Django 6.1 (`global_settings.py:192`), pas un réglage inventé |
| T1 | stubs startapp restés | fix-later (premier plan backend) | cosmétique, voir Minor 9 |
| T2 | test_stats `demo:True` dépend de l'env ; pas de test `demo=False` ; test « sans montant » faible | fix-later (prochain plan backend) | override_settings en deux lignes, sans risque pour la démo |
| T3 | suffixe f/k nu non testé | drop | le scan e2e du texte rendu couvre |
| T3 | montants en toutes lettres non détectés | drop | relève de la relecture de texte, regex disproportionnée |
| T3 | stats.ts cast sans validation | fix-later (plan campagnes, quand le payload grossit) | Minor 7 |
| T3 | URL d'API par défaut dupliquée | drop | résolu par `src/lib/api-url.ts` |
| T3 | restes create-next-app (svg, AGENTS.md, README) | fix-later (nettoyage à la prochaine tâche frontend) | README réécrit ; svg morts à supprimer ; AGENTS.md regénéré par `next dev`, à garder |
| Ruling T3/T4 | CTA vers `/inscription?role=…` (404 accepté) | fix-later (plans dev et testeur) + not-found FR avant le jury | voir Important 5 |
| Ruling T4 | port Django 8010 | drop | appliqué partout (api-url, playwright, README) |
| T4 | nav centrale seulement en xl | drop | liens dans le flux dès lg, centrés en xl : choix assumé |
| T4 | liens du menu mobile démarrent pendant le fondu | drop | imperceptible |
| T4 | anneau d'encre +50 ms | drop | sous le seuil perceptible |
| T4 | `--sheen` anime background-position | drop | résolu : translateX (`globals.css:244`) |
| T4 | drop-shadow sur le pli rotatif | drop | plus de drop-shadow dans les composants |
| T4 | « 0 test en cours » demande un seed | fix-later (avant le jury, plan campagnes ou petit fix LiveSection) | seed fait pour les testeurs, mais la section « En direct » montre encore des zéros : Important 4 |
| T4 | test du piège de focus code en dur 7 Tab | fix-later (au prochain changement de Nav) | fragile, pas faux |
| T4 | les autocollants apparaissent-ils en texte plus bas | drop | vérifié : chaque autocollant a son texte dans le stage, ProSection, Trust ou FinalCta |
| Ruling T5 | `$` suivi de `{` non compté comme montant | drop | appliqué (`check-content.mjs:5`) |
| T6 | miniature finale masque J0 (pose.ts:66) | fix-later (passe visuelle avant le jury) | défaut visuel mineur |
| T6 | « Passer l'histoire » dernier au tab ; pas de skip dans le repli | drop | résolu : SkipStory en tête, lien dans StageStatic |
| T6 | arbres live et statique toujours montés | fix-later (passe perf) | démonté après hydratation, mais doublé dans le HTML serveur : Minor 10 |
| T6 | écarts non déclarés (carte C <1.0, anneau 64vw, repli <360px) | drop | arbitré dans les rulings de la Task 8, goût de Josué |
| T6 | tests manquants (inversion useThreshold, pile reduced-motion, texte no-JS) | drop | `threshold.test.ts`, e2e reduced motion et no js existent |
| Ruling T6 | anneau qui recule à la cassure | drop | réversible, au goût de Josué |
| T6 | flèches d'arc sur les bulles (mobile) ; Awa sur 2 lignes ; mini carte step 4 contre la barre CTA | fix-later (passe visuelle mobile avant le jury) | visible sur téléphone |
| T6 | p0.19 anneau presque invisible | drop | traité par la revue visuelle T8 et son ruling |
| T6 | trace GPU réelle manquante | drop | Lighthouse et trace faits en T8 |
| T6 | h2 dupliqués dans le HTML serveur | fix-later (passe perf/SEO) | cf. Minor 10 |
| Ruling T7 | compteur J30 omis | fix-later (plan rétention) | pas de champ, pas de faux chiffre : correct |
| Ruling T7 | footer « Projet CADEV 2026 » | drop | exigé par la spec §3.11 |
| T7 | stats démo à zéro | fix-later (avant le jury) | doublon de T4 ; Important 4 |
| T7 | playwright construit toujours le bundle api-down | fix-later (plan CI) | coût de temps seulement |
| T7 | count-up écrit textContent en concurrence avec React | drop | résolu : MotionValue rendue par motion (`LiveSection.tsx:80-110`) |
| T7 | max-age 15 + revalidate 15 (jusqu'à environ 30 s) | fix-later (plan campagnes, avec SSE ou polling) | Minor 11, libellé légèrement optimiste |
| T7 | CTA final sous la ligne de flottaison en 1440×900 | drop | section haute, comportement normal |
| T7 | boucle 308/301 de `/api/:path*` | **must-fix-before-merge** | une ligne, le README affirme que la réécriture fonctionne, et le plan suivant en dépend : Important 1 |
| T7 | poll pendant le comptage, valeur périmée puis odomètre | drop | l'odomètre reprend la valeur courante à la fin, saut invisible |
| Ruling T8 | écarts §4 acceptés | drop | goût, réversible |
| Ruling T8 | badge du hero en repli « testeurs vérifiés » | drop (garder) | bon choix ; à étendre à LiveSection (Important 4) |
| T8 | DEMO_MODE vrai par défaut | fix-later (plan déploiement) | à décider avec la purge des données de démo (Minor 5) |
| T8 | 1024×768 tampons, carte break hors marge, styles dupliqués dans Loop | fix-later (passe visuelle laptop-sm) | rare en démo, mais un jury sur un petit portable le verrait |
| Ruling T8 | LCP mobile simulé 3,2-3,3 s accepté | fix-later (chantier optionnel avant le dépôt) | Perf 92-93 et CLS 0 ; le HTML doublé (Minor 10) est une piste |
| Ruling T8 | « première image » dans frontend/README.md | drop | la règle vise la landing, pas un README technique |
| T8 | waitForLiveStage attend un chunk jamais chargé sur CI <4 cœurs ; pas de test petite hauteur ou modeste | fix-later (plan CI, bloquant pour la CI) | sur un runner à 2 vCPU, tous les tests du stage expirent : forcer `hardwareConcurrency` dans la config ou ajouter un override |
| T8 | 1024×768 cartes Koffi/Grace sous la carte app | fix-later (même passe laptop-sm) | idem |

