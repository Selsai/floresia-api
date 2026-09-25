# Architecture de l’API Florésia

L’API suit l’organisation modulaire de NestJS. Ce document décrit les fichiers, modules et parcours importants.

## Fichiers de la racine

| Chemin | Rôle |
|---|---|
| `package.json` | Dépendances et commandes npm. |
| `package-lock.json` | Versions exactes installées. |
| `nest-cli.json` | Compilation NestJS. |
| `tsconfig.json` | Options TypeScript communes. |
| `tsconfig.build.json` | Fichiers retenus pour le build. |
| `eslint.config.mjs` | Règles de qualité TypeScript. |
| `.prettierrc` | Format commun du code. |
| `.env.example` | Variables requises sans secret. |
| `.gitignore` | Fichiers locaux et générés exclus. |
| `README.md` | Installation, contrôles et déploiement. |
| `.github/workflows/quality.yml` | Contrôles automatiques de GitHub. |

## Démarrage et données

| Chemin | Rôle |
|---|---|
| `src/main.ts` | Lance CORS, Helmet, validation, uploads et Swagger. |
| `src/app.module.ts` | Importe tous les modules. |
| `src/app.controller.ts` | Route de contrôle de l’API. |
| `src/app.service.ts` | Réponse du contrôle de disponibilité. |
| `prisma/schema.prisma` | Modèles et relations PostgreSQL. |
| `prisma/migrations` | Historique SQL immuable de la base. |
| `src/prisma` | Connexion Prisma partagée. |

## Modules métier

| Module | Rôle |
|---|---|
| `auth` | Inscription, JWT, profil, email et mot de passe. |
| `users` | Utilisateurs et rôles administrateur. |
| `addresses` | Adresses et adresse par défaut. |
| `products` | Bouquets du catalogue. |
| `flowers` | Fleurs, couleurs, stock et prix. |
| `favorites` | Favoris personnels. |
| `orders` | Commandes, lignes, livraison et retrait. |
| `payment` | Session Stripe et webhook signé. |
| `articles` | Journal floral. |
| `comments` | Commentaires, réponses, mentions et images. |
| `testimonials` | Avis communautaires. |
| `gallery` | Photos communautaires. |
| `chatbot` | Catalogue local, limite de messages et Gemini. |
| `mail` | Emails de vérification et de réinitialisation. |

## Composition d’un module

| Type | Rôle |
|---|---|
| `*.controller.ts` | URL, méthode HTTP et protections. |
| `*.service.ts` | Règles métier et requêtes Prisma. |
| `*.module.ts` | Dépendances NestJS du domaine. |
| `dto/create-*.dto.ts` | Validation d’une création. |
| `dto/update-*.dto.ts` | Validation d’une modification. |
| `*.spec.ts` | Tests unitaires du domaine. |

Dans `auth`, les dossiers `guards`, `roles`, `strategies` et `decorators` contrôlent le JWT, l’utilisateur courant, l’email vérifié et le rôle administrateur.

## Modèles Prisma

`User` possède les comptes et rôles. `Address` conserve les coordonnées de livraison. `Product` et `Flower` alimentent le catalogue et le configurateur. `Order` et `OrderItem` enregistrent les commandes. `Article` et `Comment` composent le journal. `Testimonial` et `GalleryPhoto` alimentent la communauté. `Favorite` relie un utilisateur à un produit.

## Scripts, fichiers et exploitation

| Chemin | Rôle |
|---|---|
| `scripts/seed-products.mjs` | Ajoute les produits de démonstration. |
| `scripts/delete-products.mjs` | Supprime volontairement ces produits. |
| `uploads/` | Images reçues pendant l’exécution. |
| `backups/` | Sauvegardes locales exclues de Git. |
| `dist/` | JavaScript compilé, généré puis ignoré. |
| `coverage/` | Rapport de couverture, généré puis ignoré. |

## Tests

Les fichiers `*.spec.ts` testent les services, contrôleurs, gardes et DTO. `test/app.e2e-spec.ts` teste l’API par HTTP. `test/http-fixture.ts` prépare l’application de test et `test/jest-e2e.json` configure Jest. Le workflow GitHub exécute lint, typecheck, couverture, e2e et build.

## Parcours d’une requête

Le DTO valide la requête. Le contrôleur applique les gardes puis appelle le service. Le service contrôle les droits et utilise Prisma. La réponse revient en JSON. Stripe utilise le corps brut pour vérifier son webhook et les uploads sont servis depuis `/uploads`.
