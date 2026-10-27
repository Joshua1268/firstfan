# FirstFan

**Tes futurs clients testent ton app.**

FirstFan met en relation des développeurs qui ont une app web et zéro vrai utilisateur avec des professionnels vérifiés du métier visé : comptables, restauratrices, commerçants, livreurs... Ces professionnels testent l'app pour de vrai, laissent des preuves de leur passage et un avis honnête. Ceux qui l'adoptent deviennent ses premiers clients, et FirstFan mesure qui revient.

Projet CADEV 2026, groupe Côte d'Ivoire.

## Le problème

Un développeur construit un MVP, le montre, entend « c'est super »... et personne ne l'utilise. Sans vrais utilisateurs ni retours honnêtes, il abandonne ou recommence. FirstFan lui donne accès directement aux personnes pour qui l'app est faite.

## Fonctionnalités

### Pour le développeur

- **Dépôt de l'app** : nom, lien, description et captures.
- **Certificat d'antériorité** : empreinte SHA-256 horodatée du projet, téléchargeable.
- **Scénario de test** en étapes, pour un métier cible.
- **Recommandation de testeurs** : les profils vérifiés les plus pertinents pour l'app sont proposés en tête de liste.
- **Suivi en direct** des tests : étapes validées, captures, réponses.
- **Validation et notation** de chaque test.
- **Tableau d'adoption** : qui utilise encore l'app à J1, J7 et J30, grâce à un script de suivi d'une ligne.

### Pour le testeur professionnel

- **Profil métier vérifié** : badge « Métier vérifié » après contrôle.
- **Invitations** aux tests qui correspondent à son métier.
- **Test guidé** sur téléphone, étape par étape, avec réponse et capture.
- **Avis structuré** : utilité pour son métier, points bloquants, intention de payer.
- **Gains** : la rémunération est créditée après validation, et le testeur la retire sur son mobile money quand il le souhaite.

### Pour l'équipe

- **Back-office** : vérification des profils, suivi des campagnes et des paiements, gestion des litiges.

## Stack

Django et Django REST framework, PostgreSQL, Next.js et React, Tailwind CSS, Motion. Le projet est entièrement conteneurisé avec Docker.
