# Florésia – API

Cette API NestJS constitue le backend de mon projet Florésia. Elle gère les comptes, le catalogue, les fleurs, les favoris, les commandes, les paiements simulés, les articles, les commentaires et les publications de la communauté.

L’API publique est disponible sur [api.floresia.fr](https://api.floresia.fr). Sa documentation Swagger est accessible sur [api.floresia.fr/api](https://api.floresia.fr/api).

## Technologies principales

- NestJS et TypeScript ;
- Prisma et PostgreSQL ;
- JWT et bcrypt pour l’authentification ;
- Stripe pour le parcours de paiement ;
- Resend pour les emails ;
- Jest et Supertest pour les tests ;
- Swagger pour la documentation REST.

## Installation locale

```powershell
npm install
Copy-Item .env.example .env
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Les variables attendues sont listées dans `.env.example`. Les clés réelles et les accès à la base ne doivent jamais être enregistrés dans Git.

## Vérifications

```powershell
npm run lint:check
npm run typecheck
npm run test:cov
npm run test:e2e -- --runInBand
npm run build
```

La couverture minimale exigée par le projet est de 50 % des lignes. Les mêmes contrôles sont exécutés automatiquement par GitHub Actions.

## Organisation

- `src` contient les modules NestJS ;
- `prisma` décrit la base et ses migrations ;
- `test` contient les tests de bout en bout ;
- `uploads` reçoit les images envoyées pendant l’exécution ;
- `.github/workflows` contient l’intégration continue.

Le rôle de chaque module est détaillé dans [ARCHITECTURE.md](ARCHITECTURE.md).

## Déploiement

L’API est déployée sur Render depuis la branche `main`. Chaque push déclenche un nouveau build. Le domaine `api.floresia.fr` pointe vers le service Render. La base PostgreSQL est hébergée sur Supabase.

Render est utilisé pour cette version pédagogique car son offre gratuite convenait au budget du projet. Une évolution vers un VPS permettrait ensuite de conserver les fichiers envoyés, choisir les ressources du serveur et héberger le front, l’API et d’autres services dans un environnement maîtrisé.

Ce dépôt accompagne un projet de formation. Les données et paiements utilisés pendant la démonstration ne constituent pas une activité commerciale réelle.
