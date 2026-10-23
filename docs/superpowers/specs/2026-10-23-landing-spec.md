# [NOM] — Spécification finale de la page d'accueil

Concept retenu : **« La boucle cassée »**, rééquilibré pour les deux publics avec des greffes de « Les deux faces » et de « La preuve en direct ».
Hackathon CADEV 2026 · Groupe Côte d'Ivoire · Stack : Next.js (App Router) + Motion (motion.dev, import `motion/react`).

Règles qui s'appliquent à toute la page, sans exception :

- **Aucun montant chiffré**, nulle part : ni dans les textes, ni dans les mocks, ni dans les captures, ni dans les attributs alt. On écrit « payé », « rémunéré », « versé », « paiement envoyé ». Une coche remplace tout montant.
- Aucun emoji. Aucune flèche Unicode (pas de flèche droite ni de flèche bas en caractère) : les flèches sont des icônes SVG.
- On n'écrit jamais « le premier en Afrique », ni aucune revendication d'exclusivité. Par prudence, le mot « premier » n'apparaît pas dans la page.
- Les chiffres en direct ne sont jamais écrits en dur. Ils viennent de l'API, notés `[n]` dans cette spec.
- Nouchi : trois expressions sur toute la page, pas plus. « le gbê » (une fois, hero), « On est ensemble » (une fois, section pro), « Tu connais la boucle » (registre familier, pas du nouchi au sens strict). Jamais de nouchi sur une ligne de paiement, de vérification ou de confidentialité.
- Wave, Orange Money et MTN MoMo sont écrits en texte simple, sans logo et sans couleur de marque.

---

## 1. Idée forte et promesse

**Idée forte.** Tout dev connaît la boucle : je construis, on me dit « c'est super », personne n'utilise, j'abandonne, je recommence. La page montre cette boucle, la casse, et par la brèche sort la carte de ton app. Cette même carte (un seul nœud DOM, jamais coupé) traverse toute l'histoire. Elle rencontre ses testeurs vérifiés, se fait tester, reçoit des retours et en donne, puis finit sur une courbe d'usage qui tient à J30. À chaque étape elle ramasse une preuve, comme un dossier qui s'épaissit. Juste après la cassure, la page donne la parole à l'autre héros : le pro, dont l'expertise est vérifiée, payée et respectée.

**Le geste unique.** Le tampon (scale 1.4 vers 1, spring 650/22, anneau d'encre vert qui s'élargit) veut dire « vérifié / validé » partout sur la page. C'est le seul geste qui porte la couleur d'accent.

**Promesse au développeur, en une phrase :**
> Tes futurs clients, des pros vérifiés de ton métier cible, testent ton MVP pour de vrai, et tu sais qui l'utilise encore à J30.

**Promesse au professionnel testeur, en une phrase :**
> Ton métier est vérifié une fois ; ensuite les devs viennent chercher ton avis, et tu es payé en mobile money après chaque test validé.

---

## 2. Les 5 premières secondes

Tout le texte du hero (kicker, H1, sous-titre, CTA, micro-ligne) est dans le HTML rendu côté serveur, **à opacité 1**. Seul `transform` est animé à l'entrée, donc le LCP n'est jamais retardé.

| Temps | Ce qui se passe |
|---|---|
| 0 ms | Fond `#0A0A0B` avec un grain fixe. La nav est déjà là, sans animation. Le texte est présent dans le DOM, les mots du H1 étant décalés sous leur masque. |
| 80 à 590 ms | H1 en Archivo condensé 800, capitales, blanc chaud, sur 3 lignes : « TES FUTURS / CLIENTS TESTENT / TON APP. ». Chaque mot sort de son masque : translateY 105 % vers 0, 640 ms, `cubic-bezier(0.16,1,0.3,1)`, 60 ms entre deux mots. C'est du CSS keyframes, qui démarre avant l'hydratation. |
| 420 ms | Le kicker, le sous-titre et la micro-ligne montent (y 12px vers 0, 420 ms, out-quint). Ils sont déjà visibles en opacité 1, seul le déplacement est animé. |
| 560 ms | Les deux CTA montent (y 16px vers 0, 420 ms). **Ils sont cliquables dès le premier rendu.** |
| 700 ms | Une coche verte `#C6F24E` se trace à la main au-dessus du mot « CLIENTS » (pathLength 0 vers 1, 380 ms, out-expo). C'est la seule tache de couleur : « les clients sont vérifiés ». |
| 800 à 1220 ms | Huit autocollants se tamponnent autour du titre (cinq sur mobile), à 60 ms d'écart, en alternant côté dev à gauche et côté pro à droite. Chacun arrive à scale 1.4 et rotate ±14°, puis spring 650/22 (mass 0.8) jusqu'à scale 1 et sa rotation finale. Pour les deux autocollants verts, un anneau d'encre part du centre. |
| 1300 ms | Le badge en direct en bas à gauche commence à battre : point vert qui pulse toutes les 1,6 s, « [n] tests en cours ». La valeur initiale est rendue côté serveur, jamais un 0 qui clignote. |
| 1300 à 5000 ms | Sur desktop, les autocollants respirent en parallaxe de profondeur avec la souris et un reflet glisse sur leur vernis. Le bandeau des métiers défile sous le pli. Au survol d'un CTA, les autocollants de son camp avancent et ceux de l'autre camp reculent : on comprend sans explication qu'il y a deux camps. |

Ce que comprend le dev en 5 s : « c'est exactement ce qui me manque, de vrais utilisateurs ». Ce que comprend le pro en 5 s : « des gens de mon métier sont vérifiés et payés pour tester ». Aucun montant n'est affiché.

---

## 3. Sections

Ordre de la page :

1. Nav
2. Hero
3. Bandeau métiers
4. Stage « Boucle et histoire » (un seul sticky : boucle, cassure, deux voix, étapes 1 à 4)
5. Et toi, le pro
6. En direct (chiffres et fil d'événements)
7. C'est quoi [NOM] ?
8. Confiance
9. Entre devs
10. CTA final
11. Footer

Le pro a donc sa scène dès le 3e écran de scroll (les deux voix), et sa section dédiée juste après l'histoire.

Sur mobile, à partir de la fin du hero, une **barre CTA collée en bas** (64px) affiche deux boutons : « Je teste » (plein, vert) et « Je suis dev » (contour). Elle se masque pendant le CTA final et quand le clavier est ouvert.

---

### 3.1 Nav

- **Copy.** À gauche : logo [NOM] en Archivo 800, blanc chaud. Au centre (desktop) : « Comment ça marche » · « Pour les testeurs » · « Entre devs ». À droite : lien « Connexion », bouton contour « Je suis développeur ».
- **Visuel.** Hauteur 64px, transparente. Après 40px de scroll, fond `#0A0A0B` à 85 % et filet bas `--line`. Pas de backdrop-filter.
- **Motion.** Opacité du fond liée au scroll avec `useTransform(scrollY,[0,40],[0,1])`. Rien d'autre.
- **Mobile.** Logo, plus un bouton menu en icône SVG à deux traits. Le menu s'ouvre en plein écran : fondu de 200 ms, puis liens qui montent en y 12px avec 40 ms d'écart.
- **Reduced-motion.** Fond qui change d'un coup, menu sans translation.

---

### 3.2 Hero

**Copy exacte**

- Kicker (mono, capitales) : `POUR LES DEVS QUI ONT UN MVP ET ZÉRO VRAI UTILISATEUR`
- H1 : `Tes futurs clients testent ton app.`
- Sous-texte : `Des comptables, restauratrices, livreurs et commerçants vérifiés testent ton MVP de bout en bout. Ils te disent le gbê, pas des compliments. Ils sont rémunérés, ils te notent, et tu sais qui l'utilise encore à J30.`
- CTA 1 (plein, accent) : `Je suis développeur` (avec une icône flèche SVG)
- CTA 2 (contour blanc chaud) : `Je teste et je suis rémunéré`
- Micro-ligne : `Inscription gratuite. Testeurs payés après validation, par Wave, Orange Money ou MTN MoMo.`
- Badge en direct (coin bas gauche) : `[n] tests en cours`
- Indice de scroll (bas centre, mono 12px) : `Tu connais la boucle ?` avec un chevron SVG.

**Autocollants** (8 sur desktop, 5 sur mobile marqués M) :

| # | Texte | Camp | Forme | Couleur | Profondeur d |
|---|---|---|---|---|---|
| 1 | Comptable vérifiée (M) | pro | pilule + coche | accent | 0.9 |
| 2 | 4,8 / 5 (M) | pro | cercle + étoile | blanc chaud | 0.5 |
| 3 | Toujours là à J7 (M) | dev | étiquette à coin plié + coche | accent | 0.8 |
| 4 | Payé après validation (M) | pro | badge dentelé | blanc chaud | 0.6 |
| 5 | Le dev aussi est noté (M) | dev | pilule | blanc chaud | 0.35 |
| 6 | Restauratrice · Cocody | pro | étiquette | blanc chaud | 0.45 |
| 7 | 14 captures horodatées | dev | ticket perforé | blanc chaud | 0.7 |
| 8 | Antériorité prouvée | dev | tampon rond | blanc chaud | 0.3 |

**Visuel.** Plein écran (`100svh`). H1 ferré à gauche sur desktop (colonnes 1 à 10 sur 12), centré sur mobile avec les retours à la ligne forcés en 4 lignes : « TES FUTURS / CLIENTS / TESTENT / TON APP. ». Les autocollants sont du HTML/CSS (pas d'image), texte en Geist 600 de 13 à 15px, ombre statique portée par un pseudo-élément, vernis `linear-gradient(115deg, transparent 30%, rgba(255,255,255,.35) 46%, transparent 62%)` en `mix-blend-mode: soft-light`, position du vernis réglée par `--sheen`. Il y a des **zones d'exclusion** : aucun autocollant ne recouvre le H1 ou les CTA (positions en pourcentage, calibrées par breakpoint). Sur mobile, les autocollants sont au-dessus et en dessous du titre, jamais dessus.

**Motion chiffrée**

- H1 : CSS `@keyframes rise { from { transform: translateY(105%) } to { transform: none } }`, 640 ms, `cubic-bezier(0.16,1,0.3,1)`, délai `calc(80ms + var(--i) * 60ms)`.
- Coche au-dessus de « CLIENTS » : `motion.path`, pathLength 0 vers 1, délai 700 ms, 380 ms, out-expo.
- Autocollants (composant client chargé par `next/dynamic`, `ssr:false`, sans saut de layout car les emplacements sont réservés) : variants `hidden {scale:1.4, rotate:±14, opacity:0}` et `shown {scale:1, rotate:r, opacity:1}`. L'opacité passe en 90 ms linéaire, scale et rotate en spring 650/22 mass 0.8. `delayChildren 0.8`, `staggerChildren 0.06`, ordre alterné gauche/droite. L'ombre est un pseudo-élément dont l'opacité va de 0 à 1 et le scale de 1.3 à 1 sur la même durée : on n'anime pas `box-shadow`.
- Anneau d'encre (autocollants accent) : cercle SVG en stroke accent, scale 0.6 vers 1.8, opacity 0.9 vers 0, 420 ms easeOut, au même instant que le contact.
- Parallaxe souris (seulement avec `pointer: fine`) : `mx` et `my` dans [-1, 1], passés par `useSpring` 120/20. Chaque autocollant : `x = mx*d*22px`, `y = my*d*16px`, `rotate = r + mx*d*3°`. Vernis : `--sheen = 50% + mx*30%`, écrit par `motionValue.on('change')` sur le parent, une écriture par frame, sans re-render React.
- Survol d'un CTA, avec le camp `dev` ou `pro` du bouton : autocollants du camp à scale 1.07 et y -6px, ceux de l'autre camp à scale 0.96 et opacity 0.45, spring 260/26. Le titre ne bouge pas. Au focus clavier, même effet.
- Survol d'un autocollant : scale 1.07, rotate vers 0, spring 400/25. Le coin plié s'ouvre (pseudo-élément rotateZ 0 vers 18°, spring 400/22). Au clic, il se re-tamponne avec l'animation d'entrée.
- Scroll (`useScroll` sur le hero, offset `['start start','end start']`) : les autocollants montent de `-d*160px` et tournent de `+d*6°` ; le H1 monte de -60px et son opacité passe de 1 à 0.25 entre 0 et 0.8.
- Badge en direct : le point pulse en CSS (pseudo-élément, scale 1 vers 1.8, opacity 0.6 vers 0, 1600 ms en boucle). Le chiffre roule en odomètre à chaque tick réel (voir 3.6).

**Mobile.** H1 `clamp(56px, 15vw, 96px)`, 5 autocollants à amplitude de scroll divisée par deux, pas de parallaxe souris ni de vernis mobile. Les CTA sont empilés, pleine largeur, 56px de haut, et le CTA pro passe **en premier** sur mobile (le testeur arrive surtout par téléphone). La barre CTA collée apparaît quand le hero sort à 80 %.

**Reduced-motion.** Tout est affiché dans son état final : autocollants à leur rotation finale, coche tracée, pas d'anneau d'encre, pas de parallaxe, pas de scroll lié. Le point en direct est fixe.

---

### 3.3 Bandeau métiers

- **Copy.** Libellé (mono, à gauche sur desktop, au-dessus sur mobile) : `MÉTIERS VÉRIFIÉS SUR [NOM]`. Défilement : `Comptable · Restauratrice · Livreur · Commerçante · Gérant de maquis · Transitaire · Pharmacienne · Couturier · Designer · Agent immobilier · Infirmière · Chauffeur VTC · Coiffeuse · Enseignant`. Ligne mono sous le bandeau : `Métier vérifié par CV, LinkedIn ou justificatif.`
- **Visuel.** Bande de 72px avec filets `--line` en haut et en bas. Métiers en Archivo wdth 75, wght 600, 28px, blanc chaud à 70 %, séparés par une petite pastille-coche SVG grise. Les bords s'estompent par un `mask-image` en dégradé linéaire de 64px.
- **Motion.** Marquee CSS (`translateX` de 0 à -50 %, contenu doublé), 40 s linéaire en boucle, `animation-play-state: paused` au survol. Toutes les 4 s, un métier visible reçoit un **mini-tampon** : la pastille passe en accent avec scale 1.5 vers 1 (spring 600/24) et le texte en blanc chaud 100 % pendant 1200 ms. C'est piloté par un intervalle qui s'arrête hors écran (`useInView`) et quand l'onglet est caché.
- **Mobile.** 22px, même comportement.
- **Reduced-motion.** Liste statique qui passe à la ligne et centrée, pas de tampon.

---

### 3.4 Stage « Boucle et histoire » (cœur de la page)

Un seul conteneur, **480vh sur desktop, 360vh sur mobile**, avec un stage `position: sticky; top: 0; height: 100svh`. Un seul `useScroll({ target: stageRef, offset: ['start start','end end'] })` donne la progression, lissée : `p = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.0005 })`.

Tous les mouvements longs sont **scrubbés** sur `p`. Toutes les micro-chorégraphies (tampons, bulles, cases cochées) sont **déclenchées par seuil** (`useMotionValueEvent(p,'change')` puis `animate()`) et jouées en temps réel, et elles s'inversent quand on remonte sous le seuil.

**Découpage de `p` :**

| Plage | Scène |
|---|---|
| 0.00 à 0.16 | Boucle : l'anneau tourne, les bulles « c'est super » apparaissent puis tombent |
| 0.16 à 0.22 | Cassure (moment signature, section 4) |
| 0.22 à 0.32 | Deux voix : dev et pro, de part et d'autre de la carte |
| 0.32 à 0.48 | Étape 01 : testeurs vérifiés |
| 0.48 à 0.64 | Étape 02 : test guidé |
| 0.64 à 0.80 | Étape 03 : retours dans les deux sens |
| 0.80 à 1.00 | Étape 04 : ils restent (duel des courbes) |

**Navigation du stage.** Sur desktop, une barre verticale à 5 crans cliquables est accrochée à gauche (Boucle, 01, 02, 03, 04). Un clic fait `scrollTo` vers le début de la plage, en `behavior: smooth`. Le lien `Passer l'histoire` mène à l'ancre `#pro`. Le cran actif est une pastille accent ; son indicateur glisse avec `layoutId 'stage-dot'`, spring 500/38. Sur mobile, c'est une barre horizontale de 5 segments en haut du stage.

**Élément persistant : la carte de l'app.** C'est un seul `motion.div`, positionné en absolu dans le stage. `x`, `y`, `scale`, `rotateY` sont des `useTransform(p, ...)` avec des jalons par plage. Il n'y a ni `layoutId` entre sections, ni démontage. C'est un mock de navigateur en HTML : barre d'adresse « monapp.ci », titre « MonApp · MVP v0.3 », contenu d'une app de facturation (liste de clients, bouton « Envoyer la facture »).

Pour passer du gris à la couleur, la carte contient **deux couches superposées**, une version grise (gris préparé dans les tokens, pas de `filter`) et une version couleur. On fait un fondu d'opacité entre les deux.

Les preuves récoltées sont des enfants en position absolue de la carte. Elles restent attachées, réduites à scale 0.7, en périphérie :

- étape 01 : badge « Métier vérifié »
- étape 02 : deux polaroïds
- étape 03 : une bulle et la pastille de note

Jalons de la carte (desktop) :

| p | x | y | scale | rotateY | opacité de la couche couleur |
|---|---|---|---|---|---|
| 0 à 0.16 | centre | centre | 0.6 | 0 | 0 (grise, opacité globale 0.55) |
| 0.22 | centre | centre | 1.0 | 0 | 1 |
| 0.32 à 0.48 | colonnes 7 à 12 | centre | 1.0 | -8° | 1 |
| 0.48 à 0.64 | colonnes 7 à 12 | centre | 1.18 | -4° | 1 |
| 0.64 à 0.80 | colonnes 7 à 12 | centre | 1.0 | -6° | 1 |
| 0.86 et plus | origine du graphe (bas gauche du graphe) | | 0.4 | 0 | 1 |

Un `perspective: 1200px` est posé sur le stage, avec deux écrans fantômes derrière la carte (translateZ -40px à opacity 0.35, translateZ -80px à opacity 0.18) façon Scale, entre 0.32 et 0.80. Sur mobile, pas d'écrans fantômes.

**Texte d'une scène.** Le bloc texte (colonnes 1 à 5) ne change **qu'une fois par plage**. La sortie fait y 0 vers -16 et opacity vers 0 en 180 ms ; l'entrée fait y 16 vers 0 en 320 ms, out-quint, déclenchée par seuil. On utilise `AnimatePresence mode="wait"` sur l'index de la scène. Aucun texte n'est lu pendant qu'il bouge.

#### Scène A : la boucle (0.00 à 0.16)

- Kicker : `TU CONNAIS LA BOUCLE`
- Titre : `On te dit « c'est super ». Personne ne l'utilise.`
- Labels de l'anneau, dans l'ordre et séparés par de petites flèches SVG le long de l'arc : `Je construis` · `« C'est super ! »` · `Personne n'utilise` · `J'abandonne`
- Compteur de tours sous l'anneau (mono) : `Tour 1 : Bilio` puis `Tour 2 : mcp-studio` puis `Tour 3 : ton prochain projet`
- Voix off (mono, gris) : `À l'ère de l'IA, construire, c'est facile. Trouver de vrais utilisateurs, c'est ça le vrai travail.`
- Bulles de chat grises autour de l'anneau : `c'est super` · `vraiment joli` · `bravo frère` · `je vais tester demain` · `en tout cas c'est propre`

**Visuel.** Anneau SVG de 480px de diamètre (78vw sur mobile), stroke 2px blanc chaud à 40 %, construit d'emblée comme **deux arcs `<path>` complémentaires A et B** qui forment un cercle fermé. Les labels sont en Archivo 600, 18px. Le label en haut est actif : opacity 1 et scale 1.2 ; les autres sont à 0.4. Les bulles sont des pilules `#1A1A1D` avec du texte `--ink-muted` et une petite queue de bulle.

**Motion**

- Rotation de l'anneau : `rotate = transform(p,[0,0.16],[0,-360])`, **un seul tour**. Les labels contre-tournent (`rotate = -ringRotate`) et restent droits. Le label actif est calculé par quart de tour et change par seuil (spring 300/30 sur scale et opacity).
- Compteur de tours : crossfade vertical (y 10 vers 0, 220 ms) aux seuils 0.04, 0.09 et 0.13.
- Bulles : elles apparaissent par seuil entre 0.01 et 0.07, une tous les 0.012 (scale 0.8 vers 1, opacity 0 vers 1, spring 300/20). Ensuite elles **se dégonflent et tombent** par scrub entre 0.08 et 0.15 : chaque bulle a son départ décalé de 0.012, `scaleX` va de 1 à 0.85, `y` de 0 à 240 puis 360px, `rotate` de 0 à ±22°, `opacity` de 1 à 0, avec `ease: cubic-bezier(0.55,0,1,0.45)` (gravité) dans `useTransform`.
- Carte au centre : opacité globale de 1 à 0.55 entre 0 et 0.16, la couche couleur passe de 1 à 0 entre 0 et 0.10. Chaque tour l'épuise.
- À l'approche de 0.15, l'anneau ralentit sur « Personne n'utilise » (le mapping s'aplatit entre 0.13 et 0.16).

#### Scène B : la cassure (0.16 à 0.22)

Voir la section 4.

Texte qui sort du masque à 0.19 :
- Titre : `Et si on cassait la boucle ?`
- Ligne : `Au lieu de « c'est super », imagine entendre : « je l'utilise encore ».`

#### Scène C : deux voix (0.22 à 0.32)

C'est la greffe du concept 2 : le pro a sa douleur lui aussi.

- Kicker : `DEUX CÔTÉS DE LA TABLE`
- Colonne gauche, avatar code : `« J'ai lancé Bilio. Puis mcp-studio. Tout le monde m'a dit : c'est super. Personne n'est revenu. »` Signature : `Le fondateur de [NOM], dev à Abidjan`
- Colonne droite, avatar métier : `« On me demande mon avis gratuitement, sur des outils qui ne connaissent rien à mon travail. Moi aussi, je veux qu'on m'écoute pour de vrai. »` Signature : `Une comptable, Plateau`
- Chute centrée sous la carte : `Deux personnes qui ont besoin l'une de l'autre. Il manquait juste l'endroit.`

**Visuel.** La carte, désormais en couleur, est au centre et sert de trait d'union. Les deux citations l'encadrent (colonnes 1 à 4 et 9 à 12), en Geist 500, 22 à 26px, guillemets français en accent. Les avatars sont des illustrations au trait, sans photo.

**Motion.** Seuil 0.23 : la colonne gauche passe de x -40 à 0 et la droite de x 40 à 0, spring 200/28. Seuil 0.25 : la chute monte (y 12 vers 0, 400 ms out-quint). Entre 0.29 et 0.32 (scrub), les colonnes s'effacent (opacity 1 vers 0) pendant que la carte glisse vers sa place de l'étape 01.

**Mobile.** Carte en haut à 60vw, puis les deux citations empilées en 18px, **la voix du pro d'abord**.

#### Scène D : étape 01, testeurs vérifiés (0.32 à 0.48)

- Kicker : `01 · TU CHOISIS TES TESTEURS`
- Titre : `Des pros de ton métier cible. Vérifiés.`
- Ligne dev : `CV, LinkedIn ou justificatif : on vérifie le métier avant tout. Tu choisis, on te recommande les mieux notés.`
- Ligne pro (étiquette mono `TESTEUR`) : `Ton métier est vérifié une fois. Après, ce sont les devs qui viennent te chercher.`
- Cartes testeurs :
  - `Awa K. · Comptable · 4,9 / 5 · Recommandée`
  - `Koffi A. · Gérant de maquis · 4,7 / 5`
  - `Grâce T. · Restauratrice · 4,8 / 5`

**Visuel.** Trois cartes `--surface` de 220x96, avatar illustré, métier, note mono, et un emplacement de tampon `MÉTIER VÉRIFIÉ`. Elles sont en éventail à gauche de la carte de l'app.

**Motion**

- Seuils 0.33, 0.345 et 0.36 : chaque carte entre depuis x -120 et rotate -6°, en spring 260/24.
- Seuils 0.37, 0.385 et 0.40 : un **tampon** sur chaque carte (scale 1.4 vers 1, rotate -12° vers -4°, spring 650/22, anneau d'encre 420 ms). À chaque impact, la carte touchée fait x [0,-3,2,-1,0] en 180 ms.
- Seuil 0.42 : la carte « Awa » glisse vers la carte de l'app et s'y ancre (x et y en spring 300/30). Les deux autres reculent (scale 0.92, opacity 0.4). Le badge « Vérifiée » d'Awa reste accroché en haut à gauche de la carte de l'app, à scale 0.7 : c'est la preuve n°1 du dossier.

**Mobile.** Deux testeurs (Awa, Grâce), empilés sous la carte.

#### Scène E : étape 02, test guidé (0.48 à 0.64)

- Kicker : `02 · ILS TESTENT POUR DE VRAI`
- Titre : `Un parcours guidé, des preuves horodatées.`
- Ligne dev : `Chaque étape est cochée, chaque écran capturé. Personne ne fait semblant d'avoir testé.`
- Ligne pro : `Un parcours clair sur ton téléphone. Tu testes à ton rythme, entre deux clients.`
- Checklist dans la carte : `Créer un compte` · `Ajouter un client` · `Envoyer une facture` · `Relancer un impayé`
- Horodatages des polaroïds (mono) : `14:32:07` · `14:33:41` · `14:35:12` · `14:36:58`

**Motion**

- Scale de la carte de 1 à 1.18 (scrub entre 0.48 et 0.52).
- Un curseur rond (16px, contour blanc chaud) suit un `offset-path` dans la carte : `offsetDistance = transform(p,[0.50,0.62],['0%','100%'])`.
- À chaque quart (0.53, 0.56, 0.59, 0.62), la case concernée se coche : coche en pathLength sur 240 ms, case en scale 0.8 vers 1 (spring 500/25), et un flash de capture (calque blanc, opacity 0.5 vers 0, 180 ms). En même temps, un polaroïd sort de derrière la carte (y 20 vers 0, rotate aléatoire déterministe entre -8° et 8°, spring 220/18) et vient s'empiler à droite, avec translateZ de -10px par polaroïd sur desktop.
- Il reste 2 polaroïds accrochés au dossier à la fin de l'étape.

**Mobile.** Pile en 2D (pas de translateZ), 3 polaroïds.

#### Scène F : étape 03, retours dans les deux sens (0.64 à 0.80)

- Kicker : `03 · DES RETOURS DE PROS`
- Titre : `Des avis francs, pas de la politesse.`
- Ligne dev : `Ce qui bloque, ce qui manque, ce qu'ils utiliseraient chaque mois. Et toi aussi, tu notes ton testeur.`
- Ligne pro : `Tu notes le dev, il te note. Une bonne note, c'est plus de missions proposées.`
- Bulles de retour :
  - `« Le bouton Payer, je l'ai cherché deux minutes. »`
  - `« Moi je classe mes factures par client, pas par date. »`
  - `« Ça, je l'utiliserais chaque fin de mois. »`
- Pastilles de note : `Testeuse vers dev : 4,6 / 5` puis `Dev vers testeuse : Testeuse fiable · 5 / 5`. Visuellement, le mot « vers » est remplacé par une icône flèche SVG.

**Motion**

- Seuils 0.66, 0.675 et 0.69 : les bulles poppent depuis le coin haut droit de la carte (`transformOrigin` sur ce coin, scale 0.6 vers 1, spring 380/20). Chaque bulle reste au moins 0.08 de `p`, soit environ 30vh de scroll, avant toute sortie.
- Deux avatars apparaissent sur un calque overlay hors de la carte : le dev à gauche, Awa à droite (seuil 0.71, spring 260/24).
- Seuil 0.72 : la **pastille vole**. La pastille « 4,6 / 5 » part de l'avatar d'Awa et vole vers l'avatar du dev sur un arc (keyframes x/y en 3 points, 720 ms, `cubic-bezier(0.33,1,0.68,1)`, rotate [-10°, 6°, 0], scale [1, 1.15, 1]). À l'arrivée, un tampon (spring 650/22) et la note du dev roule de 4,5 à 4,6 en odomètre.
- 400 ms après, la pastille « Testeuse fiable · 5 / 5 » fait le trajet inverse. La notation dans les deux sens est montrée, pas expliquée.
- Si on remonte sous 0.72, les pastilles reviennent à leur point de départ (spring 400/34).

**Mobile.** Une seule bulle à la fois (rotation des trois aux mêmes seuils), avatars de 32px au-dessus de la carte.

#### Scène G : étape 04, ils restent (0.80 à 1.00)

- Kicker : `04 · ET ILS RESTENT`
- Titre : `Pas des likes. Des gens qui reviennent.`
- Ligne dev : `Un petit script dans ton app mesure qui l'utilise encore à J7 et à J30. Enfin de vrais chiffres d'usage.`
- Ligne pro : `Tu continues d'utiliser l'app ? Tu as des avantages. Et le parrainage n'est récompensé que sur usage réel.`
- Graphe : axes `J0` · `J7` · `J30`, courbe grise pointillée intitulée `Les « c'est super »`, courbe verte intitulée `Tes testeurs vérifiés`.
- Autocollants lâchés sur la courbe : `Toujours là à J7` · `Encore là à J30`
- CTA en fin de scène : `Je fais tester mon app` (plein) et `Voir le côté testeur` (lien qui mène à `#pro`).

**Motion.** Voir la section 4, partie « Final du stage ».

#### Repli du stage

- Si `navigator.hardwareConcurrency < 4`, ou `navigator.connection.saveData`, ou si l'écran fait moins de 360px de haut : **pas de sticky**. Chaque scène devient un bloc dans le flux, révélé en `whileInView` (amount 0.4, once), avec les mêmes micro-chorégraphies déclenchées à l'entrée. La carte est dupliquée par bloc ; c'est la seule exception à la carte unique.
- **Reduced-motion.** Sept blocs statiques empilés, chacun avec son état final :
  - anneau déjà ouvert, les quatre labels lisibles dans l'ordre, les bulles en gris barrées ;
  - carte en couleur avec la phrase de cassure ;
  - les deux voix côte à côte ;
  - les testeurs tamponnés ;
  - la checklist cochée et les polaroïds posés ;
  - les bulles, avec les deux pastilles à leur place finale ;
  - le graphe complet, avec la courbe grise barrée et les deux autocollants posés.

---

### 3.5 Et toi, le pro (`#pro`)

**Copy exacte**

- Kicker : `ET TOI, LE PRO`
- Titre : `Ton métier vaut de l'argent. Ici, il est payé.`
- Sous-texte : `T'es comptable, livreur, restauratrice, commerçante ? Les devs construisent des outils pour ton travail, et ils ont besoin de ton œil. Tu testes depuis ton téléphone, tu dis ce que tu penses vraiment, et tu es payé après validation.`
- Puces, chacune avec une icône SVG au trait :
  1. `Ton métier est vérifié une fois. Ton profil parle pour toi.`
  2. `Tu choisis les missions qui te parlent.`
  3. `Tu notes le dev aussi. Ta voix compte. On est ensemble.`
  4. `Tu découvres des outils faits pour ton travail. Si tu les adoptes, tu as des avantages.`
- Mock de mission : `Tester une app de facturation` · `Environ 25 min` · `Pour comptables` · `Payé après validation` · `Wave · Orange Money · MTN MoMo`
- Écran final du mock : `Mission validée` · `Paiement envoyé`, avec une coche à la place de tout montant.
- CTA : `Je teste et je suis rémunéré`
- Ligne sous le CTA : `L'inscription prend 3 minutes. Ta note grandit à chaque test.`

**Visuel.** Sur mobile (version de référence), titre pleine largeur en Archivo condensé, puis le téléphone en HTML accessible (pas une image) : 300x600, cadre `#141416`, coins de 40px. Sur desktop, le texte est à gauche (colonnes 1 à 6) et le téléphone à droite, incliné (rotateY -14°, rotateX 6°), avec deux écrans fantômes derrière lui. Trois autocollants reviennent : « Payé après validation », « 4,8 / 5 », « Le dev aussi est noté ».

**Motion**

- `whileInView` (amount 0.35, once) : le téléphone monte (y 60 vers 0, spring 180/24). Les écrans fantômes se décalent (translateZ -40 puis -80px, opacity 0.5 puis 0.25), avec 120 ms d'écart. Les autocollants se tamponnent (spring 650/22, 60 ms d'écart).
- Boucle de démonstration, active seulement si la section est visible et l'onglet affiché :
  1. Liste des missions, 2400 ms.
  2. Tap : un ripple (cercle de scale 0 à 2.5, opacity 0.4 vers 0, 300 ms), puis l'écran de mission glisse de x 100 % vers 0 (spring 320/32), 2000 ms.
  3. « Mission validée » : la coche se trace en 400 ms, un tampon accent avec son anneau d'encre, puis la notification « Paiement envoyé » descend du haut (y -40 vers 0, spring 500/20), 2400 ms.
  4. Retour à l'état 1 par crossfade de 400 ms.
- Desktop : l'inclinaison suit la souris (±4°, spring 120/20).
- Puces : y 16 vers 0 avec 80 ms d'écart, spring 200/26.

**Mobile.** CTA pleine largeur de 56px, téléphone à 78vw, sans inclinaison ni écrans fantômes.

**Reduced-motion.** État 3 affiché en fixe, avec la liste des missions dessous en version statique. Pas de boucle, pas d'inclinaison.

---

### 3.6 En direct

**Copy exacte**

- Kicker, avec un point accent qui pulse : `EN CE MOMENT SUR [NOM]`
- Compteurs : `[n]` `tests en cours` · `[n]` `testeurs vérifiés` · `[n]` `apps testées` · `[n] %` `encore actifs à J30`
- Ligne : `Chaque chiffre vient d'un vrai test, pas d'un formulaire.`
- Mention mono pendant le hackathon : `Données de démo CADEV · mises à jour toutes les 15 s`
- Fil d'événements anonymisés (métier et commune, jamais de nom ni de montant) :
  - `Une comptable de Cocody vient de valider l'étape 4.`
  - `Un livreur d'Abobo est toujours là à J7.`
  - `Nouvelle app en test : gestion de stock pour boutiques.`

**Visuel.** Bande pleine largeur, fond `#070708`, filets `--line`. Grille de 4 colonnes sur desktop, 2x2 sur mobile. Chiffres en JetBrains Mono 500 `clamp(44px,7vw,96px)` avec `tabular-nums`, labels en Geist 14px `--ink-muted`. Le fil d'événements est en dessous et affiche 3 éléments au maximum.

**Motion**

- Les valeurs initiales sont rendues côté serveur.
- Premier passage dans le viewport (amount 0.4, once) : comptage de 0 à la valeur avec `animate(0, v, { duration: 1.2, ease: [0.22,1,0.36,1] })`, 120 ms d'écart, écrit dans `textContent` par une ref.
- Mises à jour : SSE `/api/stats/stream`, avec repli en polling toutes les 15 s. **Aucun tick simulé.** Odomètre : chaque chiffre est une colonne 0 à 9 en translateY, spring 300/30 ; seuls les chiffres qui changent bougent. Un soulignement accent passe de scaleX 0 à 1 puis opacity 1 à 0 en 600 ms.
- Fil d'événements : chaque nouvel élément entre par la gauche (x -16 vers 0, opacity, 300 ms), les autres glissent en `layout` (spring 400/35).
- Le point pulse en CSS (1600 ms).

**Accessibilité.** Une région `aria-live="polite"` résume l'état au plus une fois par minute.

**Reduced-motion.** Valeurs finales sans comptage, mises à jour en texte simple, point fixe, fil statique.

---

### 3.7 C'est quoi [NOM] ?

**Copy exacte**

- Kicker : `C'EST QUOI [NOM] ?`
- Titre : `Trois promesses. Deux gagnants.`
- 1. **Vérifié.** `Chaque testeur prouve son métier. Chaque test laisse une trace horodatée.`
  - DEV : `Tu sais qui te teste.`
  - TESTEUR : `On sait ce que tu vaux.`
- 2. **Rémunéré.** `Le testeur est payé après validation, par mobile money. Son expertise a de la valeur, on la traite comme telle.`
  - DEV : `Tu paies du vrai retour, pas des likes.`
  - TESTEUR : `Ton expertise métier est enfin reconnue.`
- 3. **Adopté.** `On ne mesure pas les « c'est super ». On mesure qui revient à J7 et à J30.`
  - DEV : `Tu vois ta vraie courbe.`
  - TESTEUR : `Tu gardes les outils qui t'aident, avec des avantages en plus.`

**Visuel.** Trois cartes `--surface`, filet de 1px, coins de 20px, et un grand numéro 01, 02, 03 en Archivo 800 `--line` derrière. Les illustrations SVG au trait font 64px :
- une carte d'identité qui reçoit un tampon ;
- un téléphone qui reçoit la notification « Paiement envoyé » (aucun chiffre) ;
- une mini-courbe qui reste haute.

Les étiquettes DEV et TESTEUR sont des petites capitales mono dans une pilule `--line`.

**Motion.** `whileInView` (amount 0.5, once) : les cartes montent (y 32 vers 0, spring 200/26) avec 100 ms d'écart. Ensuite, 200 ms après chaque carte, l'illustration se trace (pathLength, 600 ms, in-out) et son détail accent se tamponne (spring 650/22). Survol sur desktop : la carte se lève de 4px et son filet passe à l'accent 40 %, en 160 ms.

**Mobile.** Cartes empilées, sous-ligne TESTEUR affichée avant la sous-ligne DEV.

**Reduced-motion.** Illustrations complètes, pas d'entrée.

---

### 3.8 Confiance

**Copy exacte**

- Kicker : `TON IDÉE RESTE À TOI`
- Titre : `Protégé dès le dépôt.`
- Ligne : `Ton projet est horodaté dès que tu le déposes : tu as une preuve d'antériorité. Les testeurs s'engagent à la confidentialité, le contenu est protégé contre la copie, et tout est tracé.`
- Trois mini-blocs : `Preuve d'antériorité` · `Protection anti-copie` · `Notation dans les deux sens`
- Ligne de bas : `Paiements par un agrégateur mobile money. Rien ne passe de la main à la main.`
- Certificat (mono) : `Projet : MonApp` · `Déposé le 12/10/2026 à 14:02` · `sha256 : 9f3a…c21e`, tampon rond `HORODATÉ`.

**Visuel.** Fond `--surface-2`. Le certificat est à gauche, les mini-blocs à droite avec icônes au trait.

**Motion.** `whileInView` (once) : le hash s'écrit en « scramble » (des caractères aléatoires se fixent de gauche à droite, 700 ms, en `requestAnimationFrame`, avec un curseur bloc qui clignote à 1 Hz). Puis le tampon tombe : scale 1.6 vers 1, rotate -18° vers -8°, opacity 0 vers 1, spring 600/16, avec son anneau d'encre, et le certificat fait y [0,3,0] en 120 ms. Les mini-blocs suivent en stagger de 90 ms (y 20 vers 0, spring 180/24).

**Mobile.** Certificat pleine largeur au-dessus des blocs.

**Reduced-motion.** Texte complet, tampon déjà posé.

---

### 3.9 Entre devs

**Copy exacte**

- Kicker : `ET ENTRE DEVS, ON SE PARLE`
- Titre : `Une ligne de code. Et tu sais qui revient.`
- Ligne : `Colle le script : on mesure l'usage réel à J7 et à J30, sans données perso inutiles. Et quand tu bloques, la communauté est là.`
- Snippet : `<script src="https://[nom].ci/usage.js" data-app="monapp" defer></script>`
- Bouton : `Copier`, qui devient `Copié` après le clic.
- Fils de discussion, avec leurs tags :
  - `Webhooks mobile money en local, vous faites comment ?` (#paiement, `[n] réponses`)
  - `Mes 3 restauratrices ont toutes bloqué sur le même écran. Quelqu'un a déjà géré l'offline sur Next ?` (#ux)
  - `Next.js + Postgres sur un petit VPS, retours ?` (#infra)
- CTA : `Rejoindre les devs`

**Visuel.** Bloc terminal `--surface`, coloration sobre (attributs en blanc chaud, chaînes en accent 80 %). Les cartes de fil ont un avatar, une étiquette de stack en mono (Next.js, Laravel, Flutter) et le compteur de réponses. Ce compteur est un nombre de réponses, pas un montant.

**Motion.** `whileInView` : le snippet se tape à 12 ms par caractère, plafonné à 900 ms (au-delà, il apparaît par tokens), puis `data-app` se surligne en accent (fond qui passe de scaleX 0 à 1, 300 ms). Au clic sur Copier, l'icône passe à la coche (crossfade avec scale 0.6 vers 1, spring 500/25) et le libellé devient `Copié` pendant 1600 ms. Les fils apparaissent comme dans un chat : un indicateur « en train d'écrire » (3 points, y [0,-4,0] sur 600 ms avec 120 ms d'écart, pendant 500 ms), puis le message (y 10 vers 0, spring 350/30), à 700 ms d'intervalle, une seule fois.

**Mobile.** Snippet en défilement horizontal interne (le seul défilement horizontal autorisé), fils empilés.

**Reduced-motion.** Snippet complet, fils affichés, la confirmation de copie change seulement le texte.

---

### 3.10 CTA final

**Copy exacte**

- Titre énorme : `Arrête de recommencer la boucle.`
- Sous-texte : `Ton app mérite mieux que « c'est super ». Ton expertise mérite d'être payée.`
- CTA 1 : `Je suis développeur`
- CTA 2 : `Je teste et je suis rémunéré`

**Visuel.** Plein écran noir. Titre Archivo condensé sur toute la largeur. En filigrane `#1A1A1D`, l'anneau ouvert de la boucle, avec la brèche tournée vers les CTA. La carte de l'app est petite, au-dessus des CTA, avec tout son dossier de preuves. Autour, les autocollants du hero reviennent, rangés en grille propre : la planche des preuves récoltées.

**Motion**

- `whileInView` (amount 0.6, once) : l'anneau se trace (pathLength 0 vers 0.88, 900 ms, in-out) et s'arrête net en laissant la brèche.
- Les mots du titre sortent du masque (CSS, 60 ms d'écart).
- Les autocollants arrivent depuis les bords jusqu'à la grille (x et y depuis ±40vw, spring 140/18, 60 ms d'écart).
- Un dernier tampon `VALIDÉ` tombe sur la carte (spring 650/22) avec son anneau d'encre.
- Les CTA montent en spring 260/22.
- CTA plein : magnétisme léger (suit le pointeur à ±6px, spring 150/15), flèche SVG qui glisse de x 0 à 4px, press à scale 0.97.

**Mobile.** CTA empilés, pleine largeur, 56px, avec le CTA pro en premier. La barre collée est masquée ici.

**Reduced-motion.** Tout est statique, anneau ouvert, tampon posé.

---

### 3.11 Footer

- **Copy.** `[NOM] · Construit à Abidjan, pour les devs, par les devs · Projet CADEV 2026 · Groupe Côte d'Ivoire`. Liens : `Comment ça marche` · `Devenir testeur` · `Pour les devs` · `Confidentialité` · `Contact`. Mention : `Paiements via un agrégateur mobile money.`
- **Visuel.** Geist 14px `--ink-muted`, filet `--line`. Le [NOM] est en très grand, rogné en bas, en contour blanc chaud à 8 %.
- **Motion.** Le grand [NOM] remonte de y 20 % à 0 par scrub à l'entrée. En reduced-motion, il est statique.

---

## 4. Moment signature : la cassure de la boucle

Elle se joue dans le stage sticky, sur le même `p` lissé (spring 200/40).

### Préparation (au montage)

- L'anneau est fait de deux `<path>` d'arc, A (de 0° à 180°) et B (de 180° à 360°). La brèche est centrée à 0°, en haut à droite selon la rotation finale, orientée vers la colonne de l'étape 01.
- On mesure `LA = pathA.getTotalLength()` et `LB` au montage. `strokeDasharray = L` et `strokeDashoffset = 0` sur chaque arc.
- La carte a deux couches : `.card-gray` (opacité 1 au départ) et `.card-color` (opacité 0).
- La trajectoire de la carte est un `offset-path: path('M 0 0 C 60 -40, 140 -120, 210 -150 S 320 -40, 360 40')`, calculée dans le repère du stage pour passer exactement par la brèche. Elle est recalculée au resize, avec un debounce de 150 ms.

### Séquence

**1) Tension, de p = 0.16 à 0.185.** L'anneau est immobile sur « Personne n'utilise ». Le stroke passe de 2 à 3px par scrub. À p = 0.17 (seuil), la carte tremble : `x: [0,-3,3,-2,2,0]`, 260 ms, linéaire. À p = 0.18, les dernières bulles finissent de tomber.

**2) Cassure, au seuil p = 0.185, jouée en temps réel (pas scrubbée).**

- Les arcs claquent : `animate(arcA, { strokeDashoffset: LA * 18/180 })` raccourcit la fin de A de 18°, et l'arc B est raccourci au début par `strokeDasharray = "0 d L"` animé. Spring 700/14 : un léger dépassement qui fait « claquer » les bouts.
- Les deux moitiés s'écartent de 14px suivant la normale de la brèche (translate x/y calculé), en spring 400/20.
- Quatre éclats (rectangles de 6x2px, blanc chaud) partent de la brèche selon des vecteurs fixes, en spring 300/12, puis disparaissent (opacity vers 0 en 500 ms).

**3) Passage de la carte, au même seuil, en temps réel.**

- `offsetDistance` 0 % vers 100 %, 650 ms, `cubic-bezier(0.34,1.3,0.64,1)`.
- En même temps : scale de 0.6 à 1 (même durée et easing), `.card-color` en opacity de 0 à 1 et `.card-gray` de 1 à 0 (450 ms, out-quint), opacité globale de 0.55 à 1.
- Quand `offsetDistance` atteint 45 % (`onUpdate`), une **onde accent** part du point de franchissement : un cercle stroke `#C6F24E` 2px, r de 0 à 140px (on anime scale sur un cercle de r = 140), opacity de 0.8 à 0, 500 ms, out-expo. C'est la seule explosion de couleur de la page.
- Retour haptique : `navigator.vibrate(12)` sur mobile si c'est supporté et si l'utilisateur a déjà interagi avec la page. Jamais en reduced-motion.

**4) Recul de la boucle, de p = 0.19 à 0.22 (de nouveau scrubbé).**

- Le groupe anneau passe de scale 1 à 0.7 et d'opacity 1 à 0.15. Le flou est un **calque déjà flouté** (copie de l'anneau ouvert rendue une fois avec `filter: blur(4px)` sur un calque promu). On fait un crossfade vers ce calque au lieu d'animer `filter`.
- À p = 0.19 (seuil), la phrase `Et si on cassait la boucle ?` sort du masque (translateY 105 % vers 0, 640 ms, out-expo). À p = 0.20, la ligne `Au lieu de « c'est super », imagine entendre : « je l'utilise encore ».` monte (y 12 vers 0, 420 ms).
- La carte, entièrement en couleur, est au centre et ne quittera plus l'écran jusqu'à la fin du stage.

**5) Réversibilité.** Si `p` redescend sous 0.185, la séquence inverse se joue : les arcs se referment (spring 500/30), la carte revient au centre par l'offset-path inversé (450 ms), elle redevient grise, et il n'y a pas d'onde.

### Final du stage : le duel des courbes (de p = 0.80 à 1.00)

La boucle cassée trouve ici sa réponse : la courbe verte est la boucle redressée.

- La carte se replie en vignette : scale de 1 à 0.4, x et y vers l'origine du graphe (scrub entre 0.80 et 0.86). Les preuves du dossier restent visibles, à scale 0.7 relatif.
- Le graphe est un SVG de 600x320, avec l'axe X J0, J7, J30.
- Courbe grise pointillée `Les « c'est super »` (`strokeDasharray 6 6`, `--ghost`). Comme le pointillé est déjà porté par `strokeDasharray`, le tracé se fait par un `clipPath` dont la largeur suit `p` de 0.84 à 0.92 (`useTransform`). Elle chute à 4 % de rétention à J7.
- Courbe verte pleine `Tes testeurs vérifiés`, en accent, stroke 3px : `pathLength = useTransform(p,[0.86,0.97],[0,1])`.
- À p ≈ 0.90 (la verte franchit J7, seuil), l'autocollant `Toujours là à J7` est lâché au point calculé par `getPointAtLength` (tampon 650/22 avec anneau d'encre).
- À p ≈ 0.96, c'est `Encore là à J30`. Le point J30 pulse une fois (scale [1,1.6,1], 500 ms), et le libellé de la courbe grise se barre (trait qui passe de scaleX 0 à 1, 300 ms), pendant que la courbe grise passe de 60 % à 30 % d'opacité.
- Seuil 0.97 : les CTA de la scène montent (y 16 vers 0, spring 260/22).

### Performance et contraintes

- On n'anime que `transform`, `opacity`, `stroke-dashoffset` et `offset-distance`. Aucun `filter`, `box-shadow` ou `backdrop-filter` animé.
- Le DOM ne change jamais entre la boucle et l'histoire : la carte est le même élément, positionné par des motion values.
- `will-change: transform` est posé sur la carte seulement quand le stage est dans le viewport.

### Reduced-motion

Image finale directe : anneau ouvert en filigrane, carte en couleur à côté de la brèche, pas d'onde ni d'éclats, avec les deux phrases.

---

## 5. Système visuel

### Couleurs (tokens sur `:root`)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0A0A0B` | fond de page |
| `--bg-deep` | `#070708` | bande En direct |
| `--surface` | `#141416` | cartes, terminal, téléphone |
| `--surface-2` | `#111113` | section Confiance |
| `--line` | `#26262A` | filets, numéros géants |
| `--watermark` | `#1A1A1D` | anneau en filigrane, bulles |
| `--ink` | `#F2EDE3` | blanc chaud, texte principal, autocollants |
| `--ink-muted` | `#8F8A80` | texte secondaire |
| `--ghost` | `#4A4A50` | courbe fantôme, éléments éteints, carte grise |
| `--accent` | `#C6F24E` | **unique accent** : coches, tampons, badges vérifiés, points en direct, courbe d'adoption, CTA plein, onde de cassure, focus |
| `--accent-press` | `#A9D63A` | état pressé du CTA plein |
| `--accent-ink` | `#0A0A0B` | texte sur l'accent |
| `--danger` | `#FF6B5B` | erreurs de formulaire seulement, jamais en décor |

Contrastes : `--ink` sur `--bg` environ 17:1 ; `--ink-muted` sur `--bg` environ 6:1 (AA) ; `--accent-ink` sur `--accent` environ 15:1. L'accent n'est jamais utilisé en texte sur fond clair.

Le lime est éloigné du bleu Wave, de l'orange Orange et du jaune MTN. Il faut le valider côte à côte avec un jaune MTN sur fond sombre et, en cas de doute, le pousser vers `#B8F24E` (plus vert).

### Polices (toutes OFL, auto-hébergées via `next/font/google`, sous-ensembles `latin` et `latin-ext`)

| Rôle | Police | Source | Réglages |
|---|---|---|---|
| Display | Archivo (variable, axes wdth 62 à 125, wght 100 à 900) | fonts.google.com/specimen/Archivo | H1 et CTA final : wdth 62, wght 800, capitales. Titres H2 : wdth 75, wght 800, casse normale. |
| Texte | Geist (400, 500, 600) | fonts.google.com/specimen/Geist (OFL, Vercel) | corps, autocollants (600), boutons (600) |
| Mono | JetBrains Mono (500) | fonts.google.com/specimen/JetBrains+Mono | kickers, compteurs, horodatages, hash, snippet ; `font-variant-numeric: tabular-nums` |

Archivo est préchargé (`preload: true`, `display: 'swap'`, `adjustFontFallback: true`). Geist est préchargé, JetBrains Mono ne l'est pas.

### Échelle typographique (fluide)

| Style | Taille | Interlignage | Approche |
|---|---|---|---|
| H1 et titre du CTA final | `clamp(56px, 12.5vw, 196px)` | 0.86 | -0.015em |
| H2 | `clamp(36px, 6vw, 84px)` | 0.95 | -0.01em |
| H3 | `clamp(22px, 2.4vw, 30px)` | 1.15 | 0 |
| Sous-texte | `clamp(17px, 1.6vw, 21px)` | 1.5 | 0 (46ch maximum) |
| Citations | `clamp(18px, 2vw, 26px)` | 1.35 | 0 |
| Corps | 16px | 1.6 | 0 (65ch maximum) |
| Kicker | 12px mobile, 13px desktop, mono, capitales | 1.2 | 0.12em |
| Compteurs | `clamp(44px, 7vw, 96px)` mono | 1 | 0 |
| Autocollants | 13px mobile, 15px desktop, Geist 600 | 1.1 | 0 |
| Boutons | 16px Geist 600 | 1 | 0 |

### Grille et espacements

- Base de 8px.
- Grille de 12 colonnes sur desktop (max 1320px, gouttière 24px, marges 48px), 4 colonnes sur mobile (marges 16px, gouttière 12px).
- Padding vertical des sections : 160px sur desktop, 96px sur mobile.
- Aucun défilement horizontal de page.

### Rayons

- Autocollants pilule et CTA : 999px
- Autocollants étiquette : 10px
- Cartes : 20px
- Téléphone : 40px
- Terminal : 14px
- Polaroïds : 4px

### Ombres (statiques, jamais animées)

- Autocollant : pseudo-élément `0 10px 24px rgba(0,0,0,.45)` ; on anime seulement son opacité et son scale.
- Carte de l'app et téléphone : `0 40px 80px -20px rgba(0,0,0,.6)`, plus un filet intérieur `inset 0 0 0 1px rgba(242,237,227,.06)`.

### Grain et texture

- Grain : un PNG de 256x256 précalculé (bruit monochrome), répété en `position: fixed` sur un pseudo-élément du `body`, opacity 0.035, `pointer-events: none`. Aucun `feTurbulence` en direct.
- Encre des tampons : l'accent à 90 % avec un masque PNG de bruit (taches) pour l'effet tamponné.
- Pas de motif wax, pas de dégradé décoratif hors du vernis des autocollants.

### Iconographie

SVG au trait, stroke 1.5px, embouts arrondis, sur une grille de 24px. Jeu d'icônes : coche, étoile, horloge, bouclier, téléphone, appareil photo, flèche, chevron, copier, chat. Aucun emoji, aucune flèche en caractère.

---

## 6. Système motion

### Durées (ms)

| Token | Valeur | Usage |
|---|---|---|
| `instant` | 90 | opacité d'entrée des tampons |
| `fast` | 180 | sortie de texte, flash de capture, survol |
| `base` | 320 | entrée de texte |
| `medium` | 420 | sous-titres, anneau d'encre, coche |
| `slow` | 640 | mots du titre, offset-path |
| `story` | 900 | tracés d'anneau, comptage |
| `loop-pulse` | 1600 | point en direct |
| `marquee` | 40000 | bandeau métiers |

### Easings

| Token | Valeur |
|---|---|
| `ease-out-expo` | `cubic-bezier(0.16,1,0.3,1)` (reveals de titre) |
| `ease-out-quint` | `cubic-bezier(0.22,1,0.36,1)` (textes, comptages) |
| `ease-in-out` | `cubic-bezier(0.65,0,0.35,1)` (tracés d'illustration) |
| `ease-gravity` | `cubic-bezier(0.55,0,1,0.45)` (chute des bulles) |
| `ease-overshoot` | `cubic-bezier(0.34,1.3,0.64,1)` (passage de la carte par la brèche) |
| `ease-arc` | `cubic-bezier(0.33,1,0.68,1)` (vol des pastilles) |

### Springs (stiffness / damping, mass 1 sauf mention)

| Token | Valeurs | Usage |
|---|---|---|
| `stamp` | 650 / 22, mass 0.8 | geste « vérifié » : autocollants, tampons, VALIDÉ |
| `crack` | 700 / 14 | claquement des arcs |
| `snap` | 500 / 25 | coches, icône copiée, case cochée |
| `pop` | 380 / 20 | bulles de retour |
| `settle` | 260 / 24 | cartes testeurs, CTA, avatars |
| `soft` | 200 / 26 | entrées de cartes en `whileInView` |
| `lift` | 180 / 24 | téléphone, gros blocs |
| `scroll` | 200 / 40, restDelta 0.0005 | lissage du `p` du stage |
| `pointer` | 120 / 20 | parallaxe et inclinaison à la souris |
| `magnet` | 150 / 15 | CTA magnétique |
| `odometer` | 300 / 30 | chiffres roulants |

### Règles

1. **Un geste, un sens.** Le tampon et l'anneau d'encre veulent dire « vérifié / validé » et ne servent à rien d'autre. L'accent n'apparaît que sur ce qui est validé ou en direct.
2. **Scrub pour l'espace, seuil pour le geste.** Les positions et les tracés longs sont liés à `p`. Les micro-chorégraphies sont déclenchées par seuil et jouées en temps réel, et elles s'inversent quand on remonte.
3. **On ne lit rien qui bouge.** Un texte reste fixe pendant toute sa scène, et les labels de l'anneau contre-tournent.
4. **Compositor only.** On anime `transform`, `opacity`, `stroke-dashoffset` et `offset-distance`, et rien d'autre. Le flou et le gris sont des calques figés qu'on crossfade.
5. **Zéro re-render React par frame.** Tout passe par des MotionValues, `useTransform` et des écritures de variables CSS.
6. **Pas d'animation sans contenu.** Chaque mouvement révèle une info (métier, note, preuve, usage). Pas de flottement décoratif sur desktop.
7. **Mettre en pause ce qu'on ne voit pas.** Les boucles (bandeau, téléphone, tampons du bandeau, SSE visuel) s'arrêtent hors viewport et quand l'onglet est caché.
8. **Toucher n'est pas survoler.** Avec `pointer: coarse`, pas de parallaxe, pas de reflet mobile ni de magnétisme, et l'amplitude du scroll est divisée par deux.
9. **Reduced-motion.** `<MotionConfig reducedMotion="user">` à la racine, `useReducedMotion()` dans chaque composant scénarisé, et un état final statique défini pour chaque section (voir section 3). La page est aussi lisible sans JS.
10. **Budget simultané.** Au maximum 8 éléments animés en même temps sur desktop et 5 sur mobile, hors odomètre.

---

## 7. Plan technique Next.js + Motion

### Arborescence

```
app/
  layout.tsx                 polices next/font, MotionConfig (client wrapper), tokens CSS
  page.tsx                   Server Component : assemble les sections, fetch stats initiales
  api/stats/route.ts         GET JSON (valeurs initiales, cache 15 s)
  api/stats/stream/route.ts  SSE (runtime nodejs), repli polling côté client
  globals.css                tokens, grain, keyframes rise/pulse/marquee, reduced-motion
components/landing/
  Nav.tsx                    client léger (opacité du fond liée au scroll)
  Hero/Hero.tsx              server : texte SSR, emplacements des autocollants
  Hero/Stickers.tsx          client, next/dynamic : tampons, parallaxe, camps au survol CTA
  Hero/LiveBadge.tsx         client : odomètre + SSE
  ProfessionsMarquee.tsx     server + petit client pour le mini-tampon
  Stage/Stage.tsx            client : useScroll unique, spring p, nav à 5 crans, repli
  Stage/Ring.tsx             arcs A/B, labels, bulles, cassure
  Stage/AppCard.tsx          carte unique, couches grise/couleur, slots du dossier de preuves
  Stage/Scenes.tsx           texte par scène (AnimatePresence)
  Stage/StepTesters.tsx | StepGuided.tsx | StepFeedback.tsx | StepAdoption.tsx
  Stage/RatingOverlay.tsx    calque overlay des pastilles qui volent
  Stage/StaticStory.tsx      version reduced-motion et appareils faibles (server-renderable)
  ProSection/ProSection.tsx + PhoneMock.tsx (HTML accessible, boucle à 3 états)
  Live/LiveStats.tsx + Odometer.tsx + EventFeed.tsx
  WhatIs.tsx | Trust.tsx | DevExchange.tsx | FinalCta.tsx | Footer.tsx | MobileCtaBar.tsx
  primitives/Stamp.tsx       geste tampon + anneau d'encre (réutilisé partout)
  primitives/MaskReveal.tsx  reveal CSS par mots
  primitives/Sticker.tsx     formes, vernis, ombre pseudo-élément
lib/motion-tokens.ts         durées, easings, springs (section 6)
lib/useDeviceTier.ts         hardwareConcurrency, saveData, pointer
public/usage.js              script de mesure J7/J30 (< 2 Ko, sendBeacon)
scripts/check-copy.mjs       garde-fous de contenu (voir plus bas)
```

### Motion

- Import depuis `motion/react`. On utilise `LazyMotion` avec `domAnimation` par défaut, et `domMax` seulement pour les composants qui ont besoin de `layout` (fil d'événements, indicateur du stage). On utilise les composants `m.*`.
- `Stickers`, `Stage`, `PhoneMock` et `LiveStats` sont chargés par `next/dynamic`. `Stage` est importé quand il approche du viewport (IntersectionObserver avec `rootMargin: 600px`), et son squelette SSR est `StaticStory`, ce qui donne le repli sans JS.
- Le repli entre `StaticStory` et `Stage` se décide côté client après le montage, selon `useReducedMotion` et `useDeviceTier`. On ne fait de bascule de layout qu'en dessous du pli.

### Performance

- **Cibles :**
  - LCP inférieur à 2,0 s en 4G et inférieur à 2,5 s en 3G rapide simulée avec CPU x4 ;
  - CLS inférieur à 0,02 ;
  - INP inférieur à 200 ms ;
  - 60 fps sur le stage en Chrome Performance avec CPU x4 et sur un Android d'entrée de gamme réel.
- **Poids :**
  - JS du hero (premier chargement) : 90 Ko gzip maximum, Motion compris ;
  - JS total de la page : 180 Ko gzip maximum ;
  - polices : 3 fichiers en sous-ensemble, 110 Ko maximum ;
  - aucune image raster hors grain (moins de 6 Ko) et masque d'encre (moins de 8 Ko) ;
  - avatars et illustrations en SVG inline.
- **LCP.** Le H1 est en HTML et en opacité 1, et son entrée est en keyframes CSS. Archivo est préchargé, avec un fallback ajusté (`adjustFontFallback`).
- **Animation.**
  - Un seul `useScroll` pour le stage, plus un `useScroll` local pour le hero et le footer.
  - `will-change` est posé seulement pendant l'animation.
  - `contain: layout paint` sur le stage, les cartes et le téléphone.
  - Le SSE est ouvert seulement quand la bande En direct ou le badge du hero sont visibles, et fermé quand l'onglet est caché.

### Accessibilité

- Un `h1` unique. Les sections ont un `h2` et un `aria-labelledby`.
- Les autocollants sont décoratifs (`aria-hidden="true"`). Leurs infos sont reprises dans le sous-titre, dans « C'est quoi » et dans les étapes.
- Dans le stage, chaque scène est un vrai bloc de texte dans le DOM, même quand il est visuellement masqué (classe `sr-only` hors scène active). Le lien `Passer l'histoire` est le premier élément focusable du stage. La nav à crans utilise des `button` avec `aria-current`.
- Le téléphone mock est du HTML sémantique (liste, boutons non actifs en `aria-disabled`). La boucle est mise en pause au focus et au survol, avec un bouton `Mettre en pause l'animation` (WCAG 2.2.2).
- Compteurs : `aria-live="polite"` résumé au plus une fois par minute ; les odomètres sont en `aria-hidden` avec un texte équivalent.
- Focus visible : contour accent de 2px avec un offset de 3px. CTA de 56px sur mobile, cibles tactiles de 44px minimum.
- Bouton Copier : `aria-live` qui annonce « Copié ».
- Langue `lang="fr"`. Les abréviations J7 et J30 sont explicitées une fois : `<abbr title="7 jours après le test">J7</abbr>`.

### Garde-fous de contenu (CI, bloquent le build)

`scripts/check-copy.mjs` parcourt `components/`, `app/` et `public/` (TSX, TS, MD, JSON, SVG) et échoue sur :

- montants : `/\d[\d\s.,]*\s?(F|FCFA|CFA|XOF|francs?)\b/i` et `/\b(FCFA|XOF)\b/i` ;
- revendications : `/premi(er|ère)s?\b/i` et `/avant tout le monde/i` ;
- emojis : `/\p{Extended_Pictographic}/u` ;
- flèches en caractère : `/[\u2190-\u21FF]/`.

Il est lancé en `prebuild` et dans la CI. Il faut aussi relire à la main les mocks (écran « Paiement envoyé » sans aucun chiffre, ni flou ni placeholder).

### Données

- `stats` : `{ testsInProgress, verifiedTesters, appsTested, retentionJ30 }`. La date et le libellé `demo: true` sont affichés tant que la base est amorcée.
- `events` : `{ role, commune, kind, at }`, toujours anonymisés.
- Aucun tick simulé côté client.

### Ordre de construction (3 semaines)

1. **Semaine 1.**
   - Tokens, polices, `Stamp`, `MaskReveal`, `Sticker`.
   - Hero complet avec les camps au survol.
   - Bandeau métiers.
   - `StaticStory`, qui est aussi la version reduced-motion.
   - Garde-fous CI.
2. **Semaine 2.**
   - Stage : anneau, bulles, cassure, carte unique, étapes 01 et 02.
   - Section pro avec le téléphone.
3. **Semaine 3.**
   - Étapes 03 et 04 (pastilles qui volent, duel des courbes).
   - En direct avec SSE, Confiance, Entre devs, CTA final.
   - Passes perf sur Android réel et passes reduced-motion.
   - Si le temps manque, les pastilles qui volent sont remplacées par un tampon sur place.

---

## 8. Variantes de titre et micro-copies

### Titre

Le H1 est fixé : **« Tes futurs clients testent ton app. »**

Usages dérivés :

- Balise `<title>` : `[NOM] · Tes futurs clients testent ton app`
- Meta description : `Fais tester ton MVP par des pros vérifiés de ton métier cible. Testeurs rémunérés en mobile money, notation dans les deux sens, usage mesuré à J7 et J30.`
- Carte de partage (OG) : H1 + `Des pros vérifiés testent ton MVP. Tu sais qui revient à J30.`
- Variante en vouvoiement (pages institutionnelles, jury) : `Vos futurs clients testent votre app.`
- Variante courte (barre mobile, onglet) : `Fais tester ton app par tes futurs clients.`

### Boutons

| Contexte | Libellé |
|---|---|
| CTA dev principal | Je suis développeur |
| CTA pro principal | Je teste et je suis rémunéré |
| Barre mobile | Je teste · Je suis dev |
| Fin d'histoire | Je fais tester mon app · Voir le côté testeur |
| Entre devs | Rejoindre les devs |
| Copier | Copier, puis Copié |
| Stage | Passer l'histoire |
| Nav | Connexion |
| Pause de la démo téléphone | Mettre en pause l'animation · Relancer |

### Compteurs et états

| Élément | Libellé |
|---|---|
| Badge du hero | `[n] tests en cours` |
| En direct | `tests en cours` · `testeurs vérifiés` · `apps testées` · `encore actifs à J30` |
| Mention démo | `Données de démo CADEV · mises à jour toutes les 15 s` |
| Chargement | `Connexion au direct...` (sans chiffre inventé, on garde la valeur SSR) |
| Hors ligne | `Direct en pause. Dernière mise à jour à 14:32.` |
| Fil vide | `Rien de nouveau depuis une minute. Les testeurs sont sur le terrain.` |

### Micro-copies produit (mocks)

- Mission : `Tester une app de facturation` · `Environ 25 min` · `Pour comptables` · `Payé après validation`
- Validation : `Mission validée` · `Paiement envoyé`
- Notes : `Testeuse fiable · 5 / 5` · `Note du dev : 4,6 / 5`
- Preuves : `Capture 14:32:07` · `Parcours guidé 4/4` · `Métier vérifié`
- Usage : `Toujours là à J7` · `Encore là à J30`
- Confiance : `Horodaté` · `Preuve d'antériorité` · `sha256 : 9f3a…c21e`

### Textes alternatifs et accessibles

- Anneau de la boucle : `Schéma de la boucle : je construis, on me dit c'est super, personne n'utilise, j'abandonne, je recommence.`
- Graphe J30 : `Graphe d'usage : les testeurs vérifiés restent actifs à J7 et J30, tandis que les compliments chutent presque à zéro après J7.`
- Téléphone : `Démonstration de l'app testeur : liste de missions, mission ouverte, puis mission validée et paiement envoyé.`
- Certificat : `Certificat d'antériorité horodaté du projet MonApp.`
