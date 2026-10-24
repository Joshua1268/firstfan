# Plateformes à deux faces : comment le site public s'adresse aux deux publics

Recherche du 24 octobre 2026. Question : faut-il une page par public (développeurs d'un côté, testeurs de l'autre) plutôt qu'une landing unique avec deux CTA ?

## Méthode et limites

- 17 plateformes étudiées : 9 plateformes de test et de recherche utilisateur (analogues proches) et 8 marketplaces généralistes.
- Pages consultées en direct (WebFetch) le 24/10/2026. Upwork, Fiverr, Malt, Toptal, Airbnb et Uber bloquent les robots (HTTP 403 ou 406). Pour ces sites, j'ai lu des captures Wayback Machine de 2026 : Upwork accueil 01/06/2026, page freelance 26/07/2026 ; Fiverr accueil 01/06/2026, /start_selling 12/10/2026 ; Malt 11/09/2026 ; Airbnb /host/homes 15/10/2026 ; Uber accueil et /drive en 2026. J'ai extrait les titres H1/H2, les boutons et les liens du HTML.
- uTest.com ne s'affiche qu'avec JavaScript. Je l'ai analysé à partir du site client Applause, qui le relie, et de sources secondaires.
- Toptal : la page d'accueil récupérée ne montre aucun lien de candidature côté talents. Je n'ai pas pu confirmer la page talents (/talent/apply renvoie 403).
- Les citations sont en anglais quand le site est en anglais.

## Tableau des sites étudiés

Légende : « demande » = le côté qui achète ou commande (clients, chercheurs, entreprises) ; « offre » = le côté rémunéré (participants, testeurs, freelances, hôtes, chauffeurs).

| # | Plateforme | Accueil (URL) | La page d'accueil s'adresse d'abord à | Page dédiée à l'offre (URL) | Comment passer d'un public à l'autre | CTA du hero séparés par public ? | Ce que met en avant la page offre | Montants affichés côté offre |
|---|---|---|---|---|---|---|---|---|
| 1 | User Interviews | https://www.userinterviews.com/ | Demande. H1 « We connect researchers and participants », chercheurs cités en premier | https://www.userinterviews.com/hello | Menu « Participants » dans la nav, section en milieu de page « Want to earn money participating in research? », colonne footer | Non : un seul CTA « Sign up free » (chercheurs) | Gain, et facilité : « Share your opinions, get paid. It's that easy. » | Oui (fourchettes détaillées) |
| 2 | Respondent | https://www.respondent.io/ | Demande. H1 « 4.3M+ verified participants, ready when you are » | https://www.respondent.io/become-a-participant | Bloc au-dessus du hero « Conduct Research / Participate & Earn », ligne en milieu de page, footer | Non dans le hero (mais bloc double juste au-dessus) | Gain : « Get paid to share your perspective », puis volume de participants | Oui (moyenne, fourchettes) |
| 3 | Prolific | https://www.prolific.com/ | Aucun public en premier : H1 neutre « Real human data. Ready in minutes. » puis 3 cartes égales (IA, Recherche, Participants) | https://www.prolific.com/participants | 1er lien de la nav « Get paid to participate » + carte dans le hero | Oui : 3 cartes, 3 CTA | Gain et flexibilité : « Get paid to take studies… flexible schedule, real payouts », puis légitimité (Oxford 2014, ISO 27001, vérification d'identité) | Non (seulement le seuil de retrait) |
| 4 | UserTesting | https://www.usertesting.com/ | Demande (équipes produit). « Book a demo » | https://www.usertesting.com/get-paid-to-test | Lien dans la barre d'en-tête « Get Paid to Test » (« For participants and side hustles ») + « Sign in as a Participant » | Non | Gain puis flexibilité : « Boost your monthly income in your free time » ; preuve Trustpilot, logos clients | Non (« varie selon le test ») |
| 5 | Testlio | https://testlio.com/ | Demande (entreprises). Seul CTA : « Contact sales » | https://testlio.com/join-the-community | Bandeau tout en haut « Become a tester » + footer « Join the Community » | Non | Communauté et impact : « Join the world's most trusted testing community… Shape how leading brands deliver quality », puis flexibilité, paie hebdomadaire | Non (« payé à l'heure, pas au bug », sans taux) |
| 6 | uTest / Applause | https://www.applause.com/ (clients) ; https://www.utest.com/ (testeurs) | Demande sur applause.com | Domaine et marque séparés : utest.com | Lien « Join Our Community » vers utest.com/signup/personal, dans le menu Company et le footer d'Applause | Non | Côté uTest (sources secondaires) : compétences (uTest Academy), revenu complémentaire, communauté | Non vérifié |
| 7 | Maze | https://maze.co/ | Demande (équipes produit) | Aucune page pour les participants | Aucun passage : le panel n'apparaît que comme fonctionnalité vendue aux clients (/features/research-panel/) | Non | Sans objet | Sans objet |
| 8 | BetaTesting | https://betatesting.com/ | Demande. H1 « The real human beta testing platform » | https://betatesting.com/beta-testers | Barre du haut « Join as Beta Tester », menu mobile, footer | Non | Communauté et nouveauté : « Test exciting new products and get paid to give feedback », preuves (450K testeurs, SOC2, G2) | Seulement dans la FAQ |
| 9 | Askable | https://www.askable.com/ | Demande (entreprises). Seul CTA : « Book a demo » | https://www.askable.com/earn/participants | Lien en haut à droite « Get paid to test » ; menu de connexion avec choix du rôle (« I'm a participant ») | Non | Impact puis récompense : « Shape the brands you love and get rewarded », avis (5,0 sur 2 820+), logos | Oui (« up to $100 per hour ») |
| 10 | Upwork | https://www.upwork.com/ | Demande. H1 « Work at the speed of your ambition / Hire experts… » | https://www.upwork.com/i/how-it-works/freelancer/ | Bascule dans le hero « I want to hire / I want to work », menu « Find work », section « Find clients and remote jobs » (CTA « Create a profile »), footer | Oui (bascule, « hire » sélectionné par défaut) | Flexibilité : « Work the way you want » | Non sur la page (simulateur « Estimate earnings » en lien) |
| 11 | Malt | https://www.malt.fr/ | Demande. H1 « Accédez à 1M+ de freelances experts, talents de l'ère IA » | https://www.malt.fr/c/freelancers | Menu « Freelances » dans la nav, bloc « Boostez votre carrière freelance » avec CTA « Rejoindre la communauté », inscription unique « Créer mon compte » qui mène à un choix de rôle (/who-are-you) | Non (un CTA client « Trouver le freelance parfait » ; le choix du rôle se fait à l'inscription) | Carrière et sérénité : missions adaptées, paiement rapide, missions garanties | Non |
| 12 | Fiverr | https://www.fiverr.com/ | Demande. H1 « Our freelancers will take it from here » | https://www.fiverr.com/start_selling | Lien de nav « Become a Seller », footer « Become a Fiverr Freelancer », « Become an Agency » | Non | Croissance : « Turn your expertise into a global business » | Non relevé |
| 13 | Airbnb | https://www.airbnb.com/ | Demande (voyageurs) : recherche de logement | https://www.airbnb.com/host/homes | Lien d'en-tête « Become a host » (« It's easy to start hosting and earn extra income »), footer | Non | Gain : « Your home could make money on Airbnb » + simulateur, puis protection (AirCover, vérification des voyageurs) | Oui (simulateur) |
| 14 | Uber | https://www.uber.com/us/en/ | Demande. H1 « Go anywhere with Uber » | https://www.uber.com/us/en/drive/ + sous-domaine https://drivers.uber.com/ | Liens de nav « Earn » / « Drive & deliver », section en milieu de page « Drive when you want, make what you need », footer | Non | Flexibilité et gain : « Drive when you want, make what you need » | Oui (location de véhicule, page « how much drivers make ») |
| 15 | Glovo | https://glovoapp.com/ | Demande. « Food delivery and more » + saisie d'adresse | Sous-domaines https://riderhub.glovoapp.com/ (livreurs) et https://sell.glovoapp.com/ (commerces) | Cartes « Become a rider » et « Register your business » en milieu de page, footer | Non | Non lu (403) | Non lu |
| 16 | Jumia (Nigeria) | https://www.jumia.com.ng/ | Demande. Ventes flash et catalogue | https://www.jumia.com.ng/sp-marketplace-vendor/ | Barre du haut « Sell on Jumia », carte « Become a Seller », footer « Make money with Jumia » | Non | Page vendeur pauvre en argumentaire | Non |
| 17 | Toptal | https://www.toptal.com/ | Demande. H1 « Hire the Top 3% of Freelance Talent » | Non confirmée (aucun lien visible sur l'accueil récupéré) | Aucun lien relevé sur l'accueil | Non (un seul CTA « Hire Top Talent ») | Sans objet | Sans objet |

## Ce qui ressort, avec les comptes

### 1. L'accueil revient au côté demande (16 sites sur 17)

- 16 sur 17 adressent leur page d'accueil au côté qui paie : clients, chercheurs, entreprises, voyageurs, passagers, acheteurs. Seul Prolific reste neutre, avec trois cartes égales.
- Cela vaut aussi pour les plateformes qui ont besoin d'un gros volume de participants (User Interviews, Respondent, BetaTesting, Askable). Même quand les deux publics apparaissent dans le H1 (User Interviews), l'acheteur est nommé en premier et il est le seul à avoir un bouton dans le hero.
- Logique : c'est l'acheteur qui cherche une solution sur Google et qui paie la publicité. Sharetribe le dit clairement : la plupart des marketplaces performantes trouvent le SEO plus utile côté demande, parce que les clients cherchent une solution alors que les prestataires « would probably not be googling » la plateforme.

### 2. Le côté offre a presque toujours sa propre URL (15 sites sur 17)

- 15 sur 17 ont une page ou un site distinct pour l'offre. Les seules exceptions sont Maze, qui ne présente son panel que comme une fonctionnalité vendue, et Toptal, où aucun lien n'a été vu.
- Trois formats d'URL :
  - un chemin sur le même domaine, pour 11 sites : /hello, /become-a-participant, /participants, /get-paid-to-test, /join-the-community, /beta-testers, /earn/participants, /i/how-it-works/freelancer/, /c/freelancers, /start_selling, /host/homes ;
  - un sous-domaine pour l'espace opérationnel, pour 2 sites : drivers.uber.com, riderhub.glovoapp.com ;
  - une marque et un domaine séparés, pour 1 site : uTest à côté d'Applause.
- Les intitulés de lien sont presque toujours un verbe tourné vers le gain du côté offre : « Get paid to test », « Become a tester », « Become a host », « Become a Seller », « Earn », « Join as Beta Tester ».

### 3. Les boutons du hero ne sont presque jamais séparés par public (2 sites sur 17)

- 15 sur 17 n'ont qu'un CTA principal dans le hero, celui de l'acheteur, parfois doublé d'un « Book a demo ».
- Seuls Prolific (trois cartes) et Upwork (bascule « I want to hire / I want to work », « hire » par défaut) proposent le choix dans le hero. Ce sont deux plateformes très connues des deux côtés, où les deux flux pèsent lourd.
- Variante proche : Respondent place un bloc double « Conduct Research / Participate & Earn » au-dessus du hero, sans toucher au hero lui-même.

### 4. Le côté offre est rejoint par plusieurs petites portes

Nombre de sites où chaque type d'accès apparaît :

- **Lien dans l'en-tête, la barre du haut ou la nav** : 13 sites (User Interviews, Respondent, Prolific, UserTesting, Testlio, Applause, BetaTesting, Askable, Upwork, Malt, Fiverr, Airbnb, Uber, Jumia). C'est l'accès le plus courant, souvent sous forme de lien texte discret en haut à droite ou dans un bandeau au-dessus de la nav.
- **Lien en footer** : au moins 12 sites.
- **Section dédiée en milieu de page d'accueil** : 7 sites (User Interviews, Respondent, Upwork, Malt, Uber, Glovo, Jumia).
- **Choix du rôle à l'inscription ou à la connexion** : Malt (/who-are-you), Askable (« I'm a participant »), UserTesting (« Sign in as a Participant »). Les deux publics partagent donc le même point d'entrée sans que le hero ait à trancher.

### 5. Ce que met en avant la page du côté offre

- **Gain d'abord** : 7 sites (User Interviews /hello, Respondent, Prolific, UserTesting, Airbnb, Uber, BetaTesting). Ce sont surtout les panels grand public et les petits boulots.
- **Communauté, impact ou reconnaissance d'abord** : 3 sites (Testlio, Askable, BetaTesting pour le titre). Testlio est le plus proche de notre cas : testeurs qualifiés, payés à l'heure, qui « façonnent la qualité » de grandes marques.
- **Carrière ou croissance** : 2 sites (Fiverr, Malt).
- **Flexibilité** : citée partout, en tête chez Upwork (« Work the way you want ») et Uber (« Drive when you want »).
- **Preuves de légitimité** : présentes sur toutes les pages offre lues. On y trouve des avis (Trustpilot, G2), le nombre de membres, des badges de conformité (ISO 27001, SOC2), la vérification d'identité, le délai et le moyen de paiement, et la mention « pas de frais pour s'inscrire ».

### 6. Montants : on peut s'en passer

- Plusieurs pages offre convaincantes n'affichent aucun montant : Prolific (« fair rewards », « real payouts »), UserTesting (« reward amounts vary »), Testlio (« per hour, not per bug », paie hebdomadaire, sans taux), Malt, Fiverr.
- D'autres affichent des montants (Respondent, User Interviews, Askable, Airbnb avec son simulateur). Mais rien n'indique que ce soit indispensable.
- Les sites sans montant les remplacent par trois choses : le mode de calcul (« à l'heure, pas au bug »), le délai et le moyen de paiement (« weekly », « PayPal », « 14 days »), et la preuve sociale.

## Raisons SEO et publicité pour séparer les pages

- **Google Ads** : le Quality Score repose sur trois éléments, dont la « landing page experience », définie comme « How relevant and useful your landing page is to people who click your ad », et l'« ad relevance », définie comme « How closely your ad matches the intent behind a user's search » (https://support.google.com/google-ads/answer/6167118). Une annonce « devenir testeur rémunéré » qui renvoie vers une page dont le hero parle aux développeurs est moins pertinente. Le coût par clic monte et la conversion baisse.
- **SEO** : les deux publics tapent des requêtes sans rapport (« tester mon application web avant lancement » contre « être payé pour tester des applications »). Une seule URL ne peut pas viser les deux avec un H1 et un title clairs. Sharetribe cite Eventbrite, qui a une page dédiée côté offre parce que la requête « sell tickets online » a un vrai volume (https://sharetribe.com/academy/marketplace-seo/opportunities-and-challenges).
- **Conversion côté offre, cas mesuré** : Conversion Rate Experts a travaillé pour une marketplace de cours particuliers. Ils ont remplacé le formulaire générique de recrutement des tuteurs par des pages par matière et par ville. Ces pages présentent l'offre comme un emploi (« Apply » au lieu de « Register ») et s'ouvrent sur une vraie demande d'élève. Résultat : +15 % de candidatures, soit environ 20 000 de plus la première année. Les auteurs expliquent qu'une grande partie de ces visiteurs arrivait de sites d'offres d'emploi (https://conversion-rate-experts.com/real-job-listing-win-report/).
- **Avis de praticiens (opinion, pas preuve)** : les guides d'agences consultés conseillent de séparer tôt les parcours, avec des URL, des listes email et des contenus propres à chaque côté. Aucune règle officielle de Google n'impose ce découpage.

## Recommandation pour notre plateforme

### Qui est le côté demande ?

Le développeur bloqué après son MVP est l'acheteur : il apporte le projet et finance le test. Le testeur professionnel est le côté offre : il est rémunéré et noté. Les 16 sites sur 17 vont tous dans le même sens : l'accueil doit parler au développeur.

Nuance : au lancement, le côté difficile à recruter sera probablement le testeur vérifié d'un métier précis. Il aura besoin d'une page à lui qui soit soignée, pas d'une place dans le hero.

### Structure d'URL proposée

| URL | Public | Rôle |
|---|---|---|
| `/` | Développeurs | Page d'accueil et page d'atterrissage principale (SEO et Ads côté demande) |
| `/testeurs` | Professionnels testeurs | Page de recrutement complète, cible des campagnes côté offre |
| `/testeurs/[metier]` (plus tard, par exemple `/testeurs/restauration`, `/testeurs/comptabilite`) | Testeurs d'un métier donné | Pages ciblées par métier, sur le modèle du cas des tuteurs (+15 %) ; utiles pour les annonces et les requêtes métier |
| `/inscription` avec choix du rôle (ou `/inscription?role=dev` et `?role=testeur`) | Les deux | Point d'entrée commun, comme Malt (/who-are-you) ou Askable |

### Page `/` (développeurs) : ce qu'elle met en avant

1. **Le résultat** : savoir, avant de continuer à coder, si de vrais futurs clients du métier visé comprennent et veulent l'application. Le H1 parle du blocage après le MVP, pas de la plateforme.
2. **La preuve que les testeurs sont crédibles** : professionnels vérifiés du métier cible, retours structurés, notation des testeurs.
3. **Le déroulé en 3 étapes**, puis un seul CTA principal (« Faire tester mon application » ou équivalent).
4. **Le côté testeur, en petites portes** (le schéma relevé sur 13 sites) :
   - un lien texte discret en haut à droite, « Devenir testeur » ou « Je suis un professionnel » ;
   - un bandeau en milieu de page, « Vous êtes professionnel de [métier] ? Testez des applications de votre secteur et soyez rémunéré », qui renvoie vers `/testeurs` ;
   - un lien dans le footer.
5. **Le bouton « Je teste et je suis rémunéré » sort du hero.** Seuls 2 sites sur 17 séparent les boutons du hero, et ce sont des plateformes déjà connues des deux côtés. Pour un lancement, deux boutons concurrents divisent l'attention du visiteur venu de la recherche ou d'une annonce pour développeurs.

### Page `/testeurs` : ce qu'elle met en avant (sans aucun montant)

1. **La reconnaissance de l'expertise et l'impact** (modèle Testlio et Askable) : « Votre expérience de [métier] vaut quelque chose : aidez à construire les outils que vous utiliserez. » C'est le levier le plus juste pour des professionnels vérifiés, qui ne sont pas des chasseurs de micro-tâches.
2. **La rémunération, sans chiffre** (modèle Prolific, UserTesting et Testlio) : « Chaque test est rémunéré », avec le mode de calcul (par test ou par durée), le délai et le moyen de paiement, et « inscription gratuite ». Le montant de chaque mission n'apparaît qu'une fois connecté, comme le dit UserTesting (« your dashboard displays the amount for each test »).
3. **La flexibilité** : on choisit ses tests, depuis chez soi, à son rythme, et on peut refuser une mission.
4. **La confiance** : vérification du statut professionnel (présentée comme un gage de sérieux, pas comme un obstacle), notation qui valorise le profil, protection des données, interlocuteur humain.
5. **Un seul CTA** : « Rejoindre les testeurs » (plutôt « candidater » que « s'inscrire », comme dans le cas des tuteurs, puisque le profil est vérifié). Plus un lien discret de retour vers `/` pour les développeurs.

### Points de mise en œuvre

- Un title, un H1 et une meta description propres à chaque page, et des balises canoniques auto-référentes. Chaque page vise ses propres requêtes.
- Chaque campagne publicitaire pointe vers sa page (`/` pour les annonces développeurs, `/testeurs` ou `/testeurs/[metier]` pour le recrutement) afin de garder un bon score « landing page experience ».
- Mesurer la conversion séparément pour chaque page, ce qu'une landing unique ne permet pas proprement.

## Sources principales

- User Interviews : https://www.userinterviews.com/ , https://www.userinterviews.com/hello
- Respondent : https://www.respondent.io/ , https://www.respondent.io/become-a-participant
- Prolific : https://www.prolific.com/ , https://www.prolific.com/participants
- UserTesting : https://www.usertesting.com/ , https://www.usertesting.com/get-paid-to-test
- Testlio : https://testlio.com/ , https://testlio.com/join-the-community
- Applause / uTest : https://www.applause.com/ , https://www.utest.com/
- Maze : https://maze.co/
- BetaTesting : https://betatesting.com/ , https://betatesting.com/beta-testers
- Askable : https://www.askable.com/ , https://www.askable.com/earn/participants
- Upwork : https://www.upwork.com/ , https://www.upwork.com/i/how-it-works/freelancer/ (captures Wayback 2026)
- Malt : https://www.malt.fr/ , https://www.malt.fr/c/freelancers (capture Wayback 11/09/2026)
- Fiverr : https://www.fiverr.com/ , https://www.fiverr.com/start_selling (captures Wayback 2026)
- Airbnb : https://www.airbnb.com/ , https://www.airbnb.com/host/homes (captures Wayback 2026)
- Uber : https://www.uber.com/us/en/ , https://www.uber.com/us/en/drive/ , https://drivers.uber.com/
- Glovo : https://glovoapp.com/ , https://riderhub.glovoapp.com/ , https://sell.glovoapp.com/
- Jumia : https://www.jumia.com.ng/ , https://www.jumia.com.ng/sp-marketplace-vendor/
- Toptal : https://www.toptal.com/
- Google Ads, Quality Score : https://support.google.com/google-ads/answer/6167118
- Sharetribe, SEO de marketplace : https://sharetribe.com/academy/marketplace-seo/opportunities-and-challenges
- Conversion Rate Experts, cas des tuteurs : https://conversion-rate-experts.com/real-job-listing-win-report/
