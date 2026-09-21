# Audit du projet Florésia

Audit commencé le 18 septembre 2026. Florésia est une démonstration pédagogique avec Stripe en mode test. Domaine acheté chez Hostinger ; l'achat du domaine ne précise pas encore l'hébergement effectif du front et de l'API.

## État des branches
Les deux branches chore/audit-soutenance intègrent les commits de chatbot par avance rapide. Aucun commit ni push de l'audit effectué.

## Corrections initiales
- Suppression des logs affichant les utilisateurs et le contenu des JWT.
- Contrôle du propriétaire et du statut PENDING avant génération d'une session Stripe.
- Sauvegardes locales backups/ ignorées dans Git.
- Favicon traité comme un asset Vite.
- Workflow front : Node 22 et installation reproductible npm ci.

## Points initiaux et état des corrections
1. Corrigé : prix du catalogue et compositions recalculés en centimes côté serveur ; montants du navigateur ignorés.
2. Corrigé : adresse vérifiée avant création de commande.
3. Corrigé : livraison calculée côté serveur et ajoutée aux lignes Stripe.
4. Corrigé : panier conservé jusqu au paiement confirmé ; nettoyage uniquement si son contenu reste identique.
5. Corrigé : page de retour après annulation ajoutée ; confirmation vérifiée côté serveur.
6. Les tests NestJS générés sans leurs dépendances ne démontrent pas les fonctionnalités métier.
7. Front : absence de configuration de tests et de couverture.
8. Vérifier puis supprimer les secrets de développement par défaut dans la configuration JWT.
9. Vérifier les chemins des images sous le préfixe /floresia-app/.
10. Pages du footer manquantes : contact, livraison, CGV, confidentialité, FAQ, mentions légales ; liens promotions et chatbot à revoir.
11. Formulaires : associations label/champ à vérifier, état connexion sans h1.
12. SEO : titre global, descriptions par page et sitemap absents ; URLs canoniques dépendantes de l'hébergement final.
13. Images lourdes et bundle JavaScript dépassant 500 ko ; ruban signalé introuvable par Vite.
14. Contrôles console, clavier, contraste, mobile et parcours complets encore à effectuer dans le navigateur.

## Correspondance avec la grille fournie

| Attendus | Preuves à vérifier / produire |
| C1-C3 | Besoin, public, contraintes, planning et budget prévisionnel justifiés |
| C4 | Méthode agile adaptée à un projet individuel et trame de compte rendu d'activité |
| C5 | Procédure Git/IDE et démonstration de virtualisation locale |
| C6 | Wireframes datés et cohérents avec le site final |
| C7-C10 | Cahier des charges, spécifications techniques, cas d'utilisation, classes, séquences, schéma de données et architecture |
| C9 | Cycle de vie des données, sauvegarde et restauration décrits et vérifiés |
| C11 | Inventaire des traitements/traceurs, confidentialité, exercice des droits, consentement approprié et double opt-in documenté |
| C12 | Méthode de veille : sources, fréquence, collecte, actualisation et décisions issues de la veille |
| C13-C16 | Charte, UX, accessibilité, conformité du code, HTTPS/CORS/CSP, dépendances et écoconception |
| C17 | API tierce utilisée et échanges/authentification expliqués |
| C18 | Plan de tests front et couverture au moins 50 % selon la grille, p. 13 |
| C19 | QA front et tests automatisés dans la chaîne de build |
| C20 | Stratégie SEO, mesure fonctionnelle et audit justifiant au moins 70 % des critères retenus ; ce seuil n'est pas un score Lighthouse |
| C21-C24 | Persistance, filtrage, contrôle d'accès, configuration, paiement de test et monétisation justifiée |
| C25 | Plan de tests back et couverture au moins 50 %, grille p. 16 |
| C26 | QA/tests/build back automatisés et gestion des dépendances |
| C27-C32 | Préparation spécifique : documentation, domaines/TLS, hébergement, déploiement, logs, supervision, alertes et sauvegardes |

Le bloc 1 est évalué sur pièces. Les blocs 2 et 3 sont évalués sur pièces et en soutenance. Le bloc 4 relève d'une épreuve pratique séparée dans les documents fournis : il ne faut pas ajouter artificiellement une base NoSQL ou du serverless à Florésia pour reproduire l'environnement de cette épreuve.

## Mémoire : points à vérifier
- Partie A1 conception : vérifier que C1 à C12 ont leurs livrables, au-delà de la description des développements.
- Remplacer les passages obsolètes sur les API, le compte utilisateur et le chatbot encore présentés comme futurs/simulés.
- Chaque capture finale doit avoir une légende et une explication ; remplacer les emplacements vides.
- Présenter résultats de tests réels, limites et corrections, sans déclarer une conformité non mesurée.
- Partie alternance : statut juridique, analyse SWOT/PESTEL, bilan et tableau d'autoévaluation commenté, perspectives et CV.
- Page de garde normée et signée, sommaire paginé, introduction, conclusion (400 à 450 mots maximum selon le guide), bibliographie et annexes.
- Le guide demande une relecture par le maître d'apprentissage au moins une semaine avant remise.
- Préparer 20 minutes de présentation (10 front / 10 back), puis 15 minutes de questions, conformément aux documents fournis.

## Ordre de travail
1. Audit et sécurité du parcours de commande, puis tests/CI.
2. Branche feat/pages-informations : pages adaptées à une démonstration, inventaire des traceurs et traitement des demandes de droits.
3. Branche feat/refonte-visuelle : direction visuelle, composants communs, Lucide, optimisation des images et vérification d'accessibilité.
4. Branche feat/seo : métadonnées, URLs, indexation adaptée au statut de démonstration et au domaine, sitemap et outils de mesure.
5. Vérification finale, preuves du mémoire et répétition de la démonstration.

## Sources
Guide mémoire RNCP 38606 fourni par l'étudiante (26 pages) et grille d'évaluation du jury, version 1.4 du 26 juillet 2024 (20 pages). Leurs instructions décrivent les attendus scolaires ; elles ne remplacent pas une vérification juridique des traitements réellement utilisés.

## Résultats observés
- Build Vite : réussi ; images de 1 à 2 Mo et bundle de 516 ko signalés.
- Lint front initial : 9 erreurs et 2 avertissements ; effets React et exports de contextes à reprendre. Import useRef inutilisé corrigé.
- Suite back complète : premier échec confirmé sur FavoritesController, faute de PrismaService dans le module de test. Mesure de couverture non validée.
- Chemin CSS du ruban corrigé vers assets/icons/ruban.png.
- Les scripts de seed récupérés de chatbot ne contiennent plus les jetons trouvés dans la version antérieure à la fusion.
- Validation ciblée après correction : 4 suites et 32 tests réussis (paiement, Flora et DTO fleurs).
- Vérification TypeScript tsc --noEmit : réussie.
- git diff --check : réussi dans les deux dépôts.
- Audit encore ouvert : les parcours navigateur, l'accessibilité/mobile, le recalcul des montants et les suites complètes nécessitent une passe supplémentaire avant clôture.

## Deuxième passe : commandes et paiement
- Les compositions transmettent les identifiants et quantités des fleurs. Les noms/prix envoyés par le navigateur ne servent pas au calcul.
- Le stock est vérifié en cumulant les tiges entre compositions. Il n'est pas réservé ni décrémenté : une réservation transactionnelle reste à prévoir avant de véritables ventes.
- Le webhook utilise le corps brut, vérifie payment_status, devise et montant exact. La mise à jour ne concerne que PENDING pour éviter une régression de statut lors des événements répétés.
- Les anciennes commandes de test restent conservées ; recréer les anciennes compositions en attente pour tester le nouveau parcours.
- Tests ciblés : 5 suites et 52 tests réussis.
- Build front réussi après ajout du parcours de retour ; lint des deux pages de retour réussi.
- Le contrôle navigateur automatisé n'a pas pu démarrer. Le paiement Stripe complet et le comportement mobile ne sont donc pas déclarés validés.
- Les suppressions locales de docs/chatbot-recette-initiale.md, docs/chatbot-recette.md et docs/chatbot-tests.md préexistaient à cette passe : elles restent intactes.

### Pour passer aux pages d'information
Les pages peuvent être préparées après validation des tests ciblés, mais l'audit global reste ouvert tant que le lint complet, les tests globaux, la couverture et les parcours réels ne sont pas validés. Ces tâches restent à terminer avant la clôture du projet.

## Troisième passe : qualité et mesure du 18 septembre 2026
- Lint complet front : réussi après séparation des contextes/hooks et correction des effets React.
- Build front : réussi (151 modules), avertissement bundle minifié de 519,08 ko.
- Tests ciblés : 5 suites, 52 tests réussis ; ne remplace pas la suite globale.
- Script réel du catalogue Flora : 7 vérifications réussies sans appel à Gemini.
- Couverture API avec la sélection ciblée et tous les fichiers source : lignes 20,45 % (233/1139), instructions 20,59 %, branches 26,58 %, fonctions 21,42 %. Objectif de 50 % non atteint.
- Couverture front : non mise en place.
- Lint API en lecture seule : 390 erreurs et 28 avertissements, dont 302 diagnostics prettier/prettier ; erreurs de typage également présentes.
- Rapport ESLint détaillé local : .tmp/lint-api.json (ignoré par Git).
- Texte de mémoire provisoire et honnête : docs/memoire-audit-tests.md.
- Recette navigateur, paiement Stripe complet, mobile et clavier : à exécuter et consigner avant validation finale.
- Correction du recalcul des montants terminée et testée unitairement ; sa vérification sur le parcours navigateur reste à effectuer.
## Quatrième passe : bilan API et rédaction du mémoire

- Suite globale Jest confirmée : 32 suites et 231 tests réussis ; 80,96 % des lignes de l’API parcourues, au-dessus du seuil automatique de 50 %.
- Huit tests HTTP supplémentaires ont réussi avec le module NestJS réel et des dépendances externes simulées. Ils ne sont pas compris dans les 231 tests.
- Le fichier docs/memoire-audit-tests.md contient désormais le texte à insérer après la section 32.10 du mémoire : démarche, commandes, explication de la couverture, légendes des trois captures déjà disponibles et emplacements de preuves complémentaires.
- La première capture à 20,45 % est conservée comme mesure intermédiaire ; celle à 80,96 % est la mesure finale de cette passe.
- Le lint et le build du front ont réussi. La couverture des tests front n’est pas déclarée validée et sera mesurée après la refonte et les autres améliorations.
- Le lint complet de l’API, la recette navigateur, le paiement Stripe de test réel, le mobile et le clavier restent ouverts. Les workflows GitHub Actions sont configurés localement, sans exécution distante affirmée.
- Les documents plan-tests-projet-floresia.md et audit-projet-floresia.md restent utiles pour suivre ces points ; flora-catalog-regressions.json documente les cas de contrôle de Flora. Les suppressions préexistantes des trois anciens documents chatbot restent intactes.
## Cinquième passe : pages d’information et traceurs

- Inventaire des données, stockages du navigateur et appels externes consigné dans docs/inventaire-donnees-traceurs-floresia.md.
- Front : routes Contact, Mentions légales, Conditions de la démonstration, Confidentialité et Cookies/stockage local ajoutées ; footer relié aux routes existantes.
- Le formulaire de newsletter qui confirmait un abonnement inexistant a été remplacé par un lien vers le blog.
- Le retrait indique désormais que les fleuristes trouvés sont illustratifs et non partenaires ; aucune remise réelle de commande.
- Aucun script publicitaire ou d’analytics trouvé dans le code actuel : pas de bannière de consentement artificielle. Réexaminer après choix de l’hébergement et si des traceurs sont ajoutés.
- Les champs publics de configuration VITE_CONTACT_EMAIL, VITE_EDITOR_NAME, VITE_HOST_NAME et VITE_HOST_CONTACT sont décrits dans floresia-app/.env.example. Coordonnées et hébergeur finaux à confirmer avant publication.
- Lint front et build Vite réussis après ajout des pages ; avertissement de taille du bundle toujours présent.
## Sixième passe : préparation du SEO avant déploiement

- Un titre et une description adaptés ont été ajoutés pour les routes publiques, ainsi qu’un noindex pour les espaces privés et les routes inconnues.
- La route de page introuvable a été ajoutée pour éviter une page React vide sur une URL erronée.
- Le domaine prévu est floresia.fr. Le lien canonique n’est créé que lorsque VITE_SITE_URL est configuré avec l’URL réellement publiée ; aucun sitemap prétendument public n’est généré avant le déploiement.
- VITE_BASE_PATH est configurable pour garder /floresia-app/ en prévisualisation et utiliser / à la racine de Hostinger. Vérifier le fallback des routes SPA et le HTTPS au déploiement.
- Limite actuelle : React rend les métadonnées des routes après chargement JavaScript. Une stratégie de pré-rendu ou de rendu serveur, ainsi que la vérification des pages dans Google Search Console, restent à étudier avant de considérer le SEO finalisé.## Septième passe : coordonnées confirmées et préparation de la mesure SEO

- Les pages Contact et Mentions légales affichent l'adresse `contact.floresia@gmail.com` et Selsabil Amairi comme éditrice, étudiante en informatique et intelligence artificielle. Hostinger et le domaine `floresia.fr` restent indiqués comme hébergement et domaine prévus, sans prétendre que le site est déjà déployé.
- Le build front génère `sitemap.xml` et `robots.txt` uniquement si `VITE_SITE_URL` est renseigné avec une origine HTTPS. Le sitemap initial répertorie les routes publiques fixes ; les fiches dynamiques seront à ajouter après vérification des URL durables.
- Les fiches produit et articles du blog chargés avec succès reçoivent des titres, descriptions et liens canoniques spécifiques ; les fiches introuvables sont marquées `noindex`. La page de connexion a un H1 accessible.
- La grille C20 demande aussi un outil de mesure et au moins 70 % des critères techniques SEO applicables. Le guide `docs/plan-seo-deploiement.md` décrit Hostinger, Search Console, PageSpeed Insights, les captures et le tableau de preuves. Aucune position Google ni conformité finale de 70 % n'est revendiquée avant la mise en ligne et les mesures.
- Les tests front restent différés à la fin des améliorations, conformément au choix de l'étudiante.
