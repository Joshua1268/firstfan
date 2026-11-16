# FirstFan

**Tes futurs clients testent ton app.**

En ligne : https://firstfan.jk-labs.tech

FirstFan met en relation des développeurs qui ont une app web et zéro vrai utilisateur avec des professionnels vérifiés du métier visé : comptables, restauratrices, commerçants, livreurs... Ces professionnels testent l'app pour de vrai, laissent des preuves de leur passage et un avis honnête. Ceux qui l'adoptent deviennent ses premiers clients, et FirstFan mesure qui revient.

## Le problème

Un développeur construit un MVP, le montre, entend « c'est super »... et personne ne l'utilise. Sans vrais utilisateurs ni retours honnêtes, il abandonne ou recommence. FirstFan lui donne accès directement aux personnes pour qui l'app est faite.

## Fonctionnalités

### Pour le développeur

- **Dépôt de l'app** : nom, lien, description et captures.
- **Certificat d'antériorité** : empreinte SHA-256 horodatée du projet, téléchargeable.
- **Scénario de test** en étapes, pour un métier cible ou pour tout public.
- **Choix des testeurs** : ceux qui ont postulé passent en premier, et les profils les plus pertinents pour l'app sont recommandés.
- **Suivi en direct** des tests : étapes validées, captures, réponses.
- **Validation et notation** de chaque test.
- **Tableau d'adoption** : qui utilise encore l'app à J1, J7 et J30, grâce à un script de suivi d'une ligne.

### Pour le testeur professionnel

- **Inscription libre** : aucune pièce n'est demandée pour s'inscrire.
- **Campagnes ouvertes** : le testeur voit les campagnes de son métier ou ouvertes à tous, et postule.
- **Métier vérifié** : quand une campagne vise un métier, le testeur le prouve avec une pièce (carte professionnelle, RCCM, attestation, photo sur son lieu de travail ou parrainage). La pièce est supprimée après la décision, et la vérification vaut 12 mois.
- **Test guidé** sur téléphone, étape par étape, avec réponse et capture.
- **Avis structuré** : utilité pour son métier, points bloquants, intention de payer.
- **Gains** : la rémunération est créditée après validation, et le testeur la retire sur son mobile money quand il le souhaite.

### Pour l'équipe

- **Back-office** : vérification des pièces de métier, avec un motif visible en cas de refus, suivi des campagnes et des paiements, gestion des litiges.

## Lancer les deux côtés du marché

FirstFan démarre petit : un métier, une ville. Premier terrain : les comptables d'Abidjan et les développeurs qui créent des outils de gestion, de facturation ou de paie pour les PME.

### Les développeurs d'abord, puis leurs testeurs

Nous trouvons d'abord le développeur et sa campagne, puis nous recrutons les testeurs qu'il lui faut. Un comptable qui s'inscrit a ainsi un test rémunéré dans la semaine, au lieu d'une plateforme vide.

### Recruter les premiers testeurs vérifiés

- Démonstrations sur place dans des cabinets d'expertise comptable et des services comptables de PME.
- Parrainage : un testeur vérifié peut se porter garant d'un collègue du même métier.
- Relais dans les groupes où les comptables échangent déjà.

### Vérifier sans goulot d'étranglement

La vérification n'est demandée que pour postuler à une campagne ciblée, et reste valable douze mois. Pour les professions à Ordre, nous voulons vérifier l'inscription au tableau plutôt que lire des documents, puis ajouter un pré-contrôle automatique. L'équipe garde les cas douteux.

### Mesurer le retour réel

Le testeur est payé quand son test est validé. Revenir dans l'app à J7 ou J30 ne lui rapporte rien : c'est ce retour, plus qu'un « je paierais », qui montre au développeur si son app a trouvé ses premiers clients.

### Objectifs à trois mois

- 10 développeurs qui financent une campagne.
- 50 comptables vérifiés, dont une partie par parrainage.
- Chaque campagne remplie en moins d'une semaine.
- Puis un deuxième métier.

## Stack

Django et Django REST framework, PostgreSQL, Next.js et React, Tailwind CSS, Motion. Le projet est entièrement conteneurisé avec Docker.
