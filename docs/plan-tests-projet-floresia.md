# Plan de tests du projet Florésia

## Résultats automatisés vérifiés
| Contrôle | Résultat |
| --- | --- |
| Suite globale API | 32 suites / 231 tests réussis |
| Couverture de toutes les sources API | 80,96 % des lignes ; 80,04 % instructions ; 79,41 % branches ; 74,28 % fonctions |
| Objectif automatique de couverture | Au moins 50 % des lignes |
| Parcours HTTP de l’application réelle | 8 tests réussis avec persistance et fournisseurs externes simulés |
| TypeScript API | Réussi, y compris les fichiers de tests |
| Flora / catalogue réel | 7 vérifications réussies lors de la précédente passe |
| Tests et couverture front | Validation en cours, résultat final à consigner |
| Lint API | Non validé ; erreurs identifiées lors de l’audit initial |

Les tests HTTP vérifient les JWT réels, les gardes, la validation des DTO, le calcul des prix et la transmission au fournisseur de paiement. Stripe et la base sont simulés : aucun paiement ni commande n’est créé dans les services réels. Les sept vérifications de catalogue sont en lecture seule sur la base réelle.

## Commandes reproductibles

API :
- npm.cmd run test:cov
- npm.cmd run test:e2e -- --runInBand
- npm.cmd run typecheck
- npm.cmd run build
- node scripts/check-flora-catalog.cjs (configuration locale de la base requise)

Front :
- npm.cmd run test:cov
- npm.cmd run lint
- npm.cmd run build

## Recette navigateur restant à effectuer
| Scénario | Résultat attendu | Résultat observé / capture |
| --- | --- | --- |
| Trois roses à 3,50 € + une tige d’eucalyptus à 2 € | 12,50 € hors livraison, 18,40 € livré sous le seuil de gratuité | À renseigner |
| Bouquet sans feuillage | Composition possible | À renseigner |
| Rechargement après ajout d’une composition | Composition conservée dans le panier | À renseigner |
| Bouquet Romance à 32 € livré | Total 37,90 € | À renseigner |
| Livraison pour un panier de 50 € ou plus | Aucun frais | À renseigner |
| Retrait avec magasin sélectionné | Aucun frais ; magasin transmis | À renseigner |
| Annulation sur Stripe de test | Retour au panier, contenu conservé | À renseigner |
| Paiement Stripe de test | Montant identique au total serveur ; commande PAID après réception du webhook | À renseigner |
| Ouverture directe de /commande/succes sans commande | Aucun paiement confirmé | À renseigner |
| Mobile, largeur 390 px et 844 px de hauteur | Pas de débordement ; boutons et formulaires utilisables | À renseigner |
| Clavier Tab / Maj+Tab / Entrée | Focus visible, accès aux actions | À renseigner |
| Console et réseau pendant ces parcours | Consigner chaque erreur ou réponse 404 et sa correction | À renseigner |

L’outil de contrôle du navigateur n’a pas pu se connecter (échec d’écriture des fichiers du runtime). Aucun résultat visuel ou paiement Stripe complet n’est donc affirmé sur cette seule base.

## Captures pour le mémoire
1. Résumé de la suite globale API : 231 tests, 32 suites.
2. Rapport HTML de couverture API avec le total et le détail des fichiers.
3. Résumé des 8 tests HTTP.
4. Résumé des tests et de la couverture front après validation.
5. Compilation et lint front.
6. Composition, panier et paiement de test après recette réelle.
7. Mobile et focus clavier après recette réelle.

Masquer les données personnelles, JWT, clés API et liens de récupération. Les captures initiales à 52 tests et 20,45 % peuvent illustrer la progression, mais ne constituent pas le bilan final.