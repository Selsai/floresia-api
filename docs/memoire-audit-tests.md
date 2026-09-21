# Texte à insérer après « 32.10 Protection des données et bilan personnel »

## 33. Audit technique et stratégie de tests

### 33.1. Pourquoi réaliser cet audit ?

Après avoir développé les principales fonctionnalités de Florésia et le chatbot Flora, j’ai réalisé un audit technique pour vérifier que les résultats attendus correspondaient au comportement réel de l’application. Mon objectif était d’identifier les erreurs avant la soutenance, de sécuriser les opérations sensibles et de conserver des preuves reproductibles. J’ai étudié séparément l’API développée avec NestJS et le site développé avec React et Vite. Florésia restant une démonstration pédagogique, les paiements sont prévus dans l’environnement de test de Stripe.

J’ai suivi une démarche progressive : vérifier la compilation et le typage, écrire des scénarios de test correspondant aux règles métier, mesurer la couverture de code, corriger les défauts observés, puis préparer une recette manuelle des parcours complets. J’ai consigné les constats et les contrôles encore ouverts dans les documents de suivi du projet.

[Capture d’écran facultative : organisation des fichiers de tests et du dossier docs dans le dépôt, sans montrer le contenu du fichier .env.]

### 33.2. Tests automatisés de l’API

Pour l’API, j’ai utilisé Jest, l’outil de test du projet NestJS, ainsi que le module de test de NestJS. J’ai écrit des tests de services, de contrôleurs et de validation des données. Des dépendances externes comme la base de données, l’envoi d’emails et Stripe sont simulées dans les tests : je peux ainsi contrôler les réponses attendues sans envoyer de vrais messages ni effectuer de paiement.

Les scénarios ne portent pas uniquement sur les cas qui fonctionnent. J’ai également vérifié les refus : accès à une adresse ou à une commande appartenant à un autre compte, prix transmis par le navigateur différent du prix du catalogue, quantité invalide ou supérieure au stock, bouquet personnalisé sans fleur principale, paiement non confirmé, signature de webhook incorrecte et montant incohérent. Ces cas sont importants, car l’API ne doit pas accorder sa confiance aux informations financières envoyées par le navigateur.

J’ai complété ces vérifications par huit tests HTTP qui démarrent le véritable module de l’application NestJS. Ils exercent la validation des requêtes, les jetons JWT, les règles d’accès et le parcours de commande jusqu’à la réception simulée d’un événement Stripe. La base de données et les fournisseurs externes restent simulés : ces huit tests ne constituent donc pas une transaction réelle et ne sont pas compris dans les 231 tests Jest présentés ci-dessous.

Dans PowerShell, depuis le dossier floresia-api, les commandes utilisées sont :

- npm.cmd run typecheck : vérifie les types TypeScript sans générer de fichiers.
- npm.cmd run test:cov : exécute toutes les suites Jest et produit le résumé ainsi qu’un rapport HTML de couverture.
- npm.cmd run test:e2e -- --runInBand : exécute les tests HTTP de l’application.
- npm.cmd run build : compile l’API pour la production.

Le résultat confirmé de la suite principale est de 32 suites et 231 tests réussis. Les huit tests HTTP ont également réussi. La compilation et la vérification TypeScript ont réussi. En complément, j’ai exécuté sept vérifications en lecture seule sur le catalogue réel utilisé pour les réponses factuelles de Flora. Elles contrôlent notamment des produits et des prix sans appeler Gemini. Elles ne garantissent pas l’exactitude de toutes les réponses générées par le modèle.

[Capture d’écran 1, déjà disponible : premier résultat de la commande npm.cmd run test:audit:cov, avec 5 suites, 52 tests et 20,45 % de lignes couvertes. Légende : « Mesure intermédiaire avant l’extension de la suite de tests ». Cette commande lance désormais la suite complète ; la capture documente son résultat à la date où elle a été prise.]

[Capture d’écran 3, déjà disponible : résultat final affichant 32 suites, 231 tests et 80,96 % de couverture des lignes. Légende : « Suite complète de tests de l’API après ajout des scénarios manquants ». Masquer tout secret qui apparaîtrait dans le terminal.]

[Capture d’écran facultative à réaliser : résultat des 8 tests HTTP ; ne pas les présenter comme un paiement Stripe réel.]

### 33.3. Comprendre la couverture de code

La couverture, appelée « coverage » dans Jest, indique quelle part du code a été parcourue pendant l’exécution des tests. Le rapport distingue les instructions exécutées, les branches des conditions, les fonctions appelées et les lignes exécutées. Dans mon résultat final, 923 lignes sur 1 140 ont été parcourues, soit 80,96 %. La couverture des instructions est de 80,04 %, celle des branches de 79,41 % et celle des fonctions de 74,28 %. La première mesure de 20,45 % provenait d’une sélection de cinq suites ; elle m’a montré que je devais étendre les tests à davantage de modules.

La grille d’évaluation demande au moins 50 % de couverture pour la partie back-end. J’ai donc ajouté au projet un seuil automatique de 50 % des lignes : si une exécution future descend sous ce seuil, la commande de test échoue. Le rapport HTML généré dans floresia-api/coverage/index.html permet de repérer les fichiers et lignes encore peu testés. La couverture ne signifie pas que 80,96 % des fonctionnalités sont fiables ou qu’aucun défaut ne subsiste : elle mesure le code exécuté, tandis que la qualité des scénarios et les essais en situation réelle restent essentiels.

[Capture d’écran à ajouter : page d’accueil du rapport HTML coverage/index.html montrant le total de 80,96 %, puis, si cela tient sur une autre page, un exemple de fichier avec les lignes couvertes et non couvertes. Légende : « Rapport de couverture Jest après la suite complète ».]

### 33.4. Corrections révélées par les tests

Cette phase d’audit m’a permis de renforcer le parcours de commande. Le serveur recherche les produits et les fleurs dans son catalogue, calcule le prix des tiges, le total et les frais de livraison, et contrôle l’appartenance de l’adresse au compte connecté. Il cumule les quantités demandées lorsqu’une même fleur apparaît dans plusieurs compositions. Une vérification de stock existe, mais il n’y a pas encore de réservation ou de décrémentation transactionnelle ; cette fonctionnalité serait nécessaire avant une mise en vente réelle.

Pour Stripe, la création d’une session de paiement est limitée à une commande en attente appartenant au compte connecté. Le webhook vérifie la signature sur le corps brut de la requête, le statut, la devise et le montant. Le retour du navigateur sur la page de succès ne suffit donc pas à marquer une commande comme payée. Les tests ont aussi conduit à retirer un jeton de récupération de mot de passe d’une réponse et des journaux de développement.

[Capture d’écran facultative : extraits courts et commentés du service de commande et du webhook, sans clé, jeton ni donnée personnelle.]

### 33.5. Vérifications du site et limites actuelles

Dans le dossier floresia-app, j’ai utilisé npm.cmd run lint pour analyser le code et npm.cmd run build pour créer la version de production. Ces deux commandes ont réussi. La capture du build montre toutefois un avertissement : un fichier JavaScript dépasse 500 ko après minification et plusieurs images occupent plus de 1 Mo. Il s’agit de pistes d’optimisation pour la refonte visuelle et le travail sur les performances, pas d’un échec de compilation.

J’ai commencé à préparer des tests du site avec Vitest et Testing Library. Je compléterai et mesurerai leur couverture après les modifications des pages, du style et du SEO, afin de vérifier la version réellement présentée. À ce stade, je ne revendique pas de pourcentage de couverture final pour le front-end. La grille demande également au moins 50 % pour cette partie : je devrai le démontrer avec une nouvelle exécution et une capture avant la soutenance.

[Capture d’écran 2, déjà disponible : résultat de npm.cmd run build dans floresia-app. Légende : « Compilation de production du site réussie, avec avertissement sur la taille du bundle et des images ».]

[À compléter après les améliorations du front : commandes npm.cmd run lint, npm.cmd run test:cov et npm.cmd run build ; nombre de tests réussis ; pourcentage de lignes couvertes ; copie du rapport HTML ; corrections réalisées ; captures d’écran du résultat final. Ne renseigner que les valeurs réellement observées.]

### 33.6. Recette manuelle et preuve des parcours

Les tests automatisés ne remplacent pas une utilisation du site dans le navigateur. Ma recette manuelle devra couvrir la création d’un bouquet avec et sans feuillage, la persistance du panier après rechargement, le retrait en boutique, les frais de livraison, l’annulation d’un paiement et la confirmation d’une commande réellement payée en mode test Stripe. Pour un exemple vérifiable, trois roses à 3,50 € et une tige d’eucalyptus à 2 € représentent 12,50 € hors livraison ; avec 5,90 € de frais, le total attendu est 18,40 €. Je contrôlerai aussi l’affichage mobile, la navigation au clavier, les liens et les erreurs de la console. Je noterai pour chaque scénario le résultat attendu, le résultat observé et la correction éventuelle.

[Capture d’écran à ajouter après essai manuel : bouquet composé de trois roses et d’un eucalyptus, panier indiquant 12,50 € hors livraison et 18,40 € livré.]

[Capture d’écran à ajouter après essai manuel : paiement avec Stripe en mode test, retour sur le site et statut de commande confirmé par l’API ; masquer les données personnelles.]

[Capture d’écran à ajouter après essai manuel : vue mobile et focus visible lors d’une navigation au clavier.]

### 33.7. Suivi qualité et bilan

J’ai ajouté des fichiers de configuration GitHub Actions pour rejouer automatiquement les vérifications lors des futurs changements : installation des dépendances, vérification des types, tests, couverture et compilation. Leur présence dans le dépôt ne prouve pas encore qu’un lancement a réussi sur GitHub ; je conserverai une capture de l’onglet Actions uniquement après une exécution effective. Le lint complet de l’API relève encore des problèmes de formatage et de typage : je ne le présente pas comme validé.

Cet audit m’a appris à distinguer une fonctionnalité qui semble fonctionner à l’écran d’une règle réellement vérifiée. J’ai pu mesurer une progression de 20,45 % à 80,96 % de couverture des lignes pour l’API, tout en gardant visibles les limites : test Stripe réel à effectuer, couverture du front-end à mesurer après les améliorations et lint de l’API à terminer. Ces éléments guideront la dernière recette avant la soutenance.

### Sources et outils mobilisés

- Documentation officielle Jest, exécution et couverture : https://jestjs.io/docs/cli et https://jestjs.io/docs/configuration
- Documentation officielle NestJS, tests unitaires et HTTP : https://docs.nestjs.com/fundamentals/testing
- Documentation officielle Vitest, couverture du front-end : https://vitest.dev/guide/coverage
- Documentation officielle Stripe, paiements en mode test : https://docs.stripe.com/testing
- Documentation officielle GitHub Actions, tests d’un projet Node.js : https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs

Ces ressources m’ont aidée à configurer les outils et à distinguer les tests simulés des contrôles à réaliser dans le navigateur. Les commandes et chiffres ci-dessus correspondent aux résultats observés dans mon projet, pas à des exemples repris de la documentation.
## 34. Informations du site et protection des données

### 34.1. Inventaire avant rédaction

Avant de créer les pages d’information, j’ai comparé le contenu du footer avec les routes réellement présentes dans l’application. Plusieurs liens, dont Contact, Mentions légales et CGV, ne menaient à aucune page. J’ai aussi relevé les données enregistrées par le compte, les adresses, les commandes simulées, la communauté et le chatbot, puis les stockages locaux du navigateur. J’ai consigné cet inventaire dans un document de travail afin que les textes publiés correspondent aux fonctions effectivement codées.

[Capture d’écran à ajouter : ancien footer avec liens manquants, puis nouveau footer relié aux pages effectives.]

### 34.2. Pages créées pour une démonstration

J’ai ajouté les pages Contact, Mentions légales, Confidentialité, Cookies et stockage local, ainsi que les Conditions de la démonstration. Cette dernière page précise qu’il n’y a pas de vente, de livraison ou de retrait réels et que Stripe est utilisé uniquement en mode test. La page Contact et les mentions légales affichent mon identité, Selsabil Amairi, étudiante en informatique et intelligence artificielle, ainsi que l’adresse contact.floresia@gmail.com retenue pour les demandes liées au projet. Le domaine prévu est floresia.fr ; l’hébergement public est prévu chez Hostinger. L’achat du domaine et la préparation du site ne constituent pas une preuve que le déploiement est déjà terminé.

J’ai supprimé une inscription à la newsletter qui affichait une confirmation sans enregistrer d’abonnement. À sa place, la page d’accueil conduit vers le blog existant. Les anciens aperçus d’articles pointaient vers des identifiants fictifs ; ils utilisent maintenant la liste réelle renvoyée par l’API. Dans le panier, j’ai indiqué que les fleuristes trouvés pour illustrer le retrait ne sont pas des partenaires de Florésia.

[Capture d’écran à ajouter : pages Contact, Conditions de la démonstration et Confidentialité, avec les coordonnées validées.]
[Capture d’écran à ajouter : avertissement « paiement de test » dans le panier et indication de retrait simulé.]

### 34.3. Cookies, stockage local et services extérieurs

L’examen du code n’a révélé aucun script de publicité ni de mesure d’audience. En revanche, Florésia utilise localStorage pour conserver le panier et, si la personne sélectionne « Se souvenir de moi », le jeton de connexion et l’email mémorisé. sessionStorage est utilisé pour une connexion temporaire et le retour du paiement simulé. La CNIL distingue ces usages nécessaires des traceurs facultatifs qui nécessitent un consentement préalable. Je n’ai donc pas ajouté une bannière « accepter/refuser » pour des outils absents ; j’ai créé une page expliquant les stockages réellement utilisés. Si un outil de suivi est ajouté plus tard, je devrai revoir ce choix et conditionner son chargement au consentement.

Certaines fonctions sollicitent des services extérieurs après une action de la personne : Resend pour les emails de compte, Stripe pour le paiement simulé, le service public de recherche d’adresses, Overpass et OpenStreetMap pour le retrait, et Gemini pour certaines réponses de Flora. La page Confidentialité les signale et invite à ne pas transmettre de données sensibles au chatbot. Les durées de conservation et la procédure de suppression des comptes devront être fixées et vérifiées avant une ouverture publique à des utilisateurs réels.

[Capture d’écran à ajouter : page Cookies et stockage local ; éventuellement panneau Stockage du navigateur montrant uniquement des données de démonstration, sans jeton ni donnée personnelle lisible.]

Pour cette étape, je me suis appuyée sur les recommandations de la CNIL relatives aux cookies, à l’information des personnes et aux chatbots, ainsi que sur Service-Public pour distinguer les conditions d’une vente réelle de celles d’une démonstration :
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite
- https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence
- https://www.cnil.fr/fr/chatbots-les-conseils-de-la-cnil-pour-respecter-les-droits-des-personnes
- https://entreprendre.service-public.fr/vosdroits/F33527
## 35. Préparation du référencement naturel

Après avoir créé les pages d’information, j’ai commencé le SEO technique sur les routes réellement présentes. Chaque page publique possède un titre et une description adaptés ; les pages de compte, panier, paiement et administration sont marquées pour ne pas être indexées. Une page « introuvable » évite de laisser l’utilisateur devant un contenu vide. J’ai également prévu un chemin de base configurable : le site reste accessible sous /floresia-app/ pendant la prévisualisation, puis pourra être construit à la racine du domaine floresia.fr chez Hostinger.

J’ai préparé la génération conditionnelle de sitemap.xml et de robots.txt dans le build du front : ils ne sont produits que lorsque VITE_SITE_URL désigne une URL HTTPS publique. Les liens canoniques suivent la même règle. Leur fonctionnement réel reste à vérifier après le déploiement, le choix de l’URL de l’API et la vérification du HTTPS, des redirections et des liens directs. Le site étant actuellement une application React rendue dans le navigateur, les métadonnées des routes changent après l’exécution de JavaScript. Google peut traiter ces pages, mais un pré-rendu et un contrôle dans Search Console seront à étudier pour une indexation plus fiable. L’objectif de la grille concernant les critères techniques SEO sera évalué après ces vérifications, pas déduit de la seule présence de balises.

[Capture d’écran à ajouter après mise en ligne : code source et rendu d’une page publique montrant son titre, sa description, son H1 et son URL canonique.]
[Capture d’écran à ajouter après mise en ligne : vérification du sitemap, du HTTPS et de l’inspection d’URL dans Search Console, si ce service est configuré.]

Sources : documentation Google Search Central sur le rendu JavaScript et les sitemaps, documentation Vite sur le chemin de base.
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://vite.dev/config/shared-options
### 35.1. Mesure et validation selon la grille du jury

La compétence C20 de la grille RNCP 38606 ne demande pas seulement des balises : elle vérifie aussi le contenu et les mots-clés, le choix et l’intégration d’un outil de mesure de performance marketing, puis une conformité à au moins 70 % des critères techniques SEO applicables. J’ai choisi Google Search Console pour suivre l’indexation, les requêtes, les impressions, les clics et les erreurs de pages, sans ajouter de traceur publicitaire à cette démonstration. Cette intégration ne pourra être déclarée fonctionnelle qu’après la validation de la propriété du domaine par DNS chez Hostinger, le dépôt du sitemap et l’apparition des premiers rapports. PageSpeed Insights et Lighthouse compléteront les mesures de performance, d’accessibilité et d’affichage mobile.

Je vérifierai un tableau de critères daté : HTTPS et redirections, robots.txt, sitemap, indexabilité, titres et descriptions uniques, H1, liens canoniques, liens internes, textes alternatifs des images, mobile, Core Web Vitals et pertinence des contenus. Le pourcentage sera calculé sur les critères applicables réellement vérifiés, sans l’assimiler au score Lighthouse. À cette étape, je n’affirme ni que les 70 % sont atteints ni que le site est déjà bien positionné : le domaine n’est pas encore déployé et les mesures publiques ne sont pas disponibles.

[Capture d’écran à ajouter : Hostinger montrant le domaine floresia.fr relié au site et le certificat HTTPS actif, en masquant les données du compte.]
[Capture d’écran à ajouter : propriété Domaine vérifiée dans Google Search Console et sitemap accepté.]
[Capture d’écran à ajouter : inspection d’une URL publique, puis rapport Performances montrant les impressions et clics lorsque des données existent.]
[Capture d’écran à ajouter : PageSpeed Insights sur une page mobile et ordinateur, avec l’URL et la date de mesure.]
[Capture d’écran à ajouter : tableau des critères SEO C20, preuves, écarts, actions correctives et ratio final.]

Les étapes de déploiement et de mesure sont consignées dans docs/plan-seo-deploiement.md. Sources complémentaires : https://developers.google.com/search/docs/fundamentals/seo-starter-guide , https://developers.google.com/search/docs/monitor-debug/search-console-start et https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/ .
