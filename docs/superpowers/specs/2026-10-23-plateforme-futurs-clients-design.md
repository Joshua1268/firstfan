# Conception : plateforme « Tes futurs clients testent ton app »

Statut : brouillon, en attente de validation de Josué.
Nom du produit : FirstFan (choisi le 25/10, voir `docs/recherche/2026-10-25-nom-anglais.md`). Nom technique du dossier `cadev-2026`.

## 1. Intention

Un développeur construit vite un MVP avec l'IA, le montre, entend « c'est super », mais personne ne l'utilise. Sans vrais utilisateurs ni avis honnêtes, il abandonne et recommence la boucle (vécu du fondateur avec Bilio et mcp-studio).

La plateforme permet à ce développeur de faire tester son app web de bout en bout par ses **futurs clients** : des professionnels du métier visé, dont le métier est vérifié. Ils sont rémunérés, notés, et ceux qui adoptent l'app deviennent ses premiers utilisateurs. La plateforme mesure cette adoption.

Promesse : « Tes futurs clients testent ton app. »

Lien avec le thème CADEV (« la plateforme d'échange africaine, pour les devs, par les devs ») : construite par un dev, pour les devs bloqués après le MVP ; échange de valeur entre devs et professionnels, et échange technique entre devs.

## 2. Objectifs

- Gagner le CADEV 2026 (groupe Côte d'Ivoire). Grille : pertinence 25 %, technique 30 %, UX 20 %, innovation 15 %, vote des autres candidats 10 %.
- Démo en direct sans faille du cycle complet : dépôt d'une app, choix des testeurs vérifiés, test guidé avec preuves, retours notés, suivi d'adoption J7.
- Page d'accueil « wahou » et compréhensible en 5 secondes, pour les deux publics.
- Si possible, vraies données avant le 15 novembre (3 développeurs confirmés, 5 à 6 professionnels visés).

## 3. Non-objectifs (MVP)

- Tests d'apps mobiles natives (Android/iOS) : présentés comme la suite.
- Détention réelle de fonds (licence BCEAO) : paiements via le bac à sable d'un agrégateur ou simulés.
- Vérification automatique LinkedIn (API fermée) : vérification manuelle dans le back-office.
- Application mobile native pour les testeurs : site web responsive, pensé d'abord pour le téléphone.

## 4. Anti-objectifs (échec même si « ça marche »)

- Afficher un montant chiffré sur la page d'accueil ou dans les supports publics. Les prix apparaissent uniquement dans l'espace connecté (décision de Josué du 23/10).
- Ressembler à BetaUsers ou TestFi : des testeurs anonymes génériques payés à la tâche.
- Une démo qui plante, ou des animations qui saccadent sur un ordinateur de jury.
- Dire « le premier en Afrique ».
- Un composant GPL, AGPL ou LGPL dans le livrable.
- Des emojis dans l'interface ou les documents.

## 5. Contraintes

- Soumission le 2026-11-15 à 17:00 GMT ; vote obligatoire de chaque membre du 15 nov. 18:00 au 16 nov. 23:59.
- Déploiement en HTTPS sur un produit Datacloud (promo 40 %), hébergé à Dakar.
- Déclaration des licences et de l'usage de l'IA ; code antérieur au concours déclaré (aucun prévu).
- Données personnelles (CV, pièces) : déclaration ARTCI à prévoir, consentement explicite, stockage minimal.
- Licences vérifiées le 23/10 :
  - `psycopg` et `psycopg2` sont sous LGPL, donc exclus : on utilise `pg8000` (BSD-3) avec le backend `django-pg8000` (MIT-0, 0.0.5, ne passe pas toute la suite de tests Django ; à valider par nos propres tests dès le premier jour, avec SQLite en repli de dernier recours).
  - Next.js tire `sharp`, qui embarque libvips (LGPL-3.0), en dépendance optionnelle : on le remplace par un paquet vide via `overrides` et on met `images.unoptimized: true`. Vérification dans l'audit de licences.

## 6. Approches considérées

| Approche | Pour | Contre |
|---|---|---|
| **Next.js + Django/DRF** (choix de Josué) | admin Django = back-office gratuit, ORM et gestion des utilisateurs mûrs, Next.js pour une landing animée de haut niveau | deux services à déployer, pilote PostgreSQL à contourner (LGPL) |
| Next.js full-stack | un seul projet, un seul déploiement | pas de back-office prêt, auth et audit de licences à refaire |
| Reprendre FastAPI de Navigo | code déjà écrit et testé | pas de back-office, front Vite moins adapté au rendu de la landing |

Choix : Next.js (App Router) + Django REST Framework, décidé par Josué pour le back-office et l'ORM.

## 7. Utilisateurs et parcours

### Développeur (sur ordinateur)
1. Inscription.
2. Création du projet : nom, lien de l'app web, description, métier cible (ex. comptable), nombre de testeurs, scénario de test en étapes.
3. Certificat d'antériorité généré : empreinte SHA-256 horodatée de la description et des captures, téléchargeable.
4. Installation du script de suivi (une ligne) dans son app ; la plateforme vérifie qu'il répond.
5. Choix des testeurs : liste filtrée par métier vérifié, note et disponibilité, avec les recommandés en tête. Il invite.
6. Paiement de la campagne (bac à sable agrégateur ou simulé).
7. Suivi en direct : qui teste, étapes validées, preuves.
8. Lecture des retours, validation de chaque test (ce qui libère la rémunération), note du testeur.
9. Tableau d'adoption : qui revient à J1, J7, J30 ; parrainages venus des testeurs.

### Testeur professionnel (sur téléphone d'abord)
1. Inscription.
2. Profil métier : métier, entreprise ou activité, lien LinkedIn, CV ou justificatif ; badge « Métier vérifié » après validation dans le back-office.
3. Réception d'invitations correspondant à son métier.
4. Acceptation de l'engagement de confidentialité (case à cocher, horodatée), puis ouverture de l'app via un lien personnel.
5. Test guidé étape par étape : une réponse par étape, une capture, horodatage. Le script de suivi confirme qu'il a réellement parcouru l'app.
6. Avis final structuré : utilité pour son métier, ce qui bloque, est-ce qu'il paierait.
7. Rémunération après validation par le dev ; note du dev.
8. S'il continue à utiliser l'app : avantages, et parrainage récompensé seulement sur usage réel des filleuls.

### Administrateur (admin Django)
Vérification des profils et des pièces, modération, litiges, suivi des paiements, statistiques.

### Échange entre devs (P1)
Un dev peut faire un test technique de l'app d'un autre dev (bugs, sécurité, performance) et gagner des crédits qui réduisent le coût de ses propres campagnes.

## 8. Fonctionnalités et priorités

- **P0 (indispensables à la démo)**
  - Authentification avec deux rôles.
  - Projets et campagnes, scénario en étapes.
  - Profils testeurs et vérification manuelle.
  - Choix des testeurs avec recommandations.
  - Test guidé avec preuves.
  - Retours, validation, notation dans les deux sens.
  - Script de suivi et tableau d'adoption J1/J7/J30.
  - Certificat d'antériorité.
  - Paiement simulé derrière une interface de fournisseur.
  - Landing animée.
  - Back-office.
  - Déploiement HTTPS, tests, audit des licences.
- **P1**
  - Paiement via le vrai bac à sable CinetPay ou PayDunya.
  - Parrainage sur usage réel.
  - Échange technique entre devs avec crédits.
  - Notifications par e-mail.
  - Compteurs en direct sur la landing.
- **P2**
  - Notifications WhatsApp.
  - Export PDF des rapports.
  - Score de qualité des retours par IA.

## 9. Architecture

- `frontend/` : Next.js (App Router), TypeScript, Tailwind, bibliothèque Motion (MIT), polices sous licence OFL. Pages publiques en rendu serveur ; espaces dev et testeur.
- `backend/` : Django 5, DRF, `django-pg8000`, PostgreSQL 16. Sessions Django avec cookie httpOnly, protection CSRF, front et API sur le même domaine via Caddy.
- Script de suivi : fichier JS servi par l'API (`/t.js`).
  - L'identifiant du testeur passe dans l'URL de test, puis est conservé dans le stockage du navigateur du domaine de l'app.
  - Le script envoie des événements de visite à `/api/track/`.
  - Le serveur calcule les sessions, J1, J7 et J30.
- Fichiers (captures, CV) : stockage local du serveur au départ, avec un chemin d'accès privé.
- Déploiement : Docker Compose (Caddy, frontend, backend, PostgreSQL) sur le VPS Datacloud, sur le modèle de `navigo/docker-compose.prod.yml`.
- Qualité : tests pytest côté API, tests de composants et parcours Playwright côté front, audit de licences (script adapté de Navigo).

## 10. Modèle de données (première version)

- Utilisateur (rôle : dev, testeur, admin).
- ProfilTesteur : métier, LinkedIn, pièce, statut de vérification, note moyenne.
- Projet : dev, nom, URL, description, empreinte d'antériorité.
- Campagne : projet, métier cible, nombre de testeurs, statut, paiement.
- ÉtapeScénario : campagne, ordre, consigne.
- Invitation : campagne, testeur, statut, jeton personnel.
- SessionTest : invitation, début, fin, preuves par étape.
- Retour : réponses structurées, avis final.
- Notation : dans les deux sens.
- ÉvénementSuivi : jeton, URL, horodatage.
- Paiement : fournisseur, référence, statut.
- Parrainage (P1).
- Crédit (P1).

## 11. Page d'accueil

- Spécification détaillée produite par le workflow « landing-motion-message » : `docs/superpowers/specs/2026-10-23-landing-spec.md` (copiée depuis le scratchpad une fois terminée).
- Décisions fixées :
  - Titre « Tes futurs clients testent ton app. »
  - Aucun montant affiché.
  - Autocollants-infos flottants dans le hero.
  - Histoire au défilement avec un élément continu.
  - Compteurs en direct sans montants.
  - Bloc « C'est quoi ? » en trois points.
  - Deux boutons : « Je suis développeur » et « Je teste et je suis rémunéré ».

## 12. Scénario de démo (cible)

1. Landing.
2. Un dev crée un projet (une vraie petite app web de l'équipe), obtient son certificat d'antériorité et installe le script.
3. Il choisit deux testeurs « Comptable vérifiée ».
4. Sur téléphone, une testeuse fait le test guidé.
5. Le dev voit les preuves en direct, valide et note.
6. Le tableau d'adoption montre les retours J1/J7 (données d'une campagne réelle si elle a eu lieu, sinon données de démonstration clairement marquées).

## 13. Calendrier

- **24 au 27 oct.** : socle du projet, contournement des licences validé, authentification, modèles, back-office, landing (première version).
- **28 oct. au 1er nov.** : parcours dev et testeur P0, script de suivi, déploiement sur le VPS.
- **2 au 9 nov.** : vraies campagnes avec les 3 devs, P1, finition UX et motion.
- **10 au 14 nov.** : gel des fonctionnalités, tests, vidéo, pitch, déclarations.
- **15 nov.** : soumission.

## 14. Laissé au constructeur

- Découpage précis des composants.
- Noms des routes d'API.
- Choix de la librairie de tests front.
- Format exact du certificat.

## 15. Questions ouvertes pour Josué

- Domaine définitif (FirstFan : .io, .dev, .africa libres le 25/10) et logo.
