# Architecture de l’API Florésia

L’API suit l’organisation modulaire de NestJS. Chaque domaine contient un module, un contrôleur, un service et ses DTO.

## Racine

| Chemin | Rôle |
|---|---|
| `src/main.ts` | Démarre l’API, CORS, sécurité, validation et Swagger. |
| `src/app.module.ts` | Rassemble tous les modules. |
| `prisma/schema.prisma` | Décrit les tables et relations. |
| `prisma/migrations` | Historique des changements de base. |
| `test/` | Tests de l’API complète. |
| `.github/workflows/quality.yml` | Lance les contrôles sur GitHub. |

## Modules métier

| Module | Rôle |
|---|---|
| `auth` | Inscription, connexion, JWT, profil et récupération du compte. |
| `users` | Administration des utilisateurs et des rôles. |
| `addresses` | Adresses de livraison et adresse par défaut. |
| `products` | Catalogue des bouquets. |
| `flowers` | Fleurs du configurateur personnalisé. |
| `favorites` | Favoris de chaque utilisateur. |
| `orders` | Commandes, lignes, livraison et retrait. |
| `payment` | Session Stripe et webhook de paiement. |
| `articles` | Articles du journal floral. |
| `comments` | Commentaires, réponses, mentions et images. |
| `testimonials` | Avis de la communauté. |
| `gallery` | Photos envoyées par la communauté. |
| `chatbot` | Réponses locales et appel facultatif à Gemini. |
| `mail` | Emails de vérification et de réinitialisation. |
| `prisma` | Connexion partagée à PostgreSQL. |

## Lecture d’un module

- Le `controller` reçoit la requête HTTP et applique les droits.
- Le `service` contient les règles métier et les requêtes Prisma.
- Le dossier `dto` valide les données reçues.
- Le fichier `module` assemble les dépendances.
- Les fichiers `*.spec.ts` testent les comportements importants.

## Parcours d’une requête

La requête est validée par un DTO, puis transmise du contrôleur au service. Le service vérifie les droits et utilise Prisma. La réponse est renvoyée en JSON. Les routes protégées utilisent le JWT et certaines exigent un email vérifié ou le rôle administrateur.
