# Inventaire vérifié dans le code — Florésia (démonstration pédagogique)

Cet inventaire sert à rédiger les pages publiques. Il décrit le code local au 19 septembre 2026, pas les choix du futur hébergeur ni une conformité juridique acquise.

| Fonction | Données et stockage observés | Service externe / point de vigilance |
| --- | --- | --- |
| Compte | Email, nom, prénom, téléphone optionnel, empreinte du mot de passe, rôle et dates en PostgreSQL via Prisma | Email de vérification et récupération envoyé par Resend ; adresse de l’éditeur pour l’exercice des droits à confirmer |
| Authentification | JWT conservé dans localStorage si « se souvenir de moi », sinon sessionStorage ; email mémorisé seulement dans le premier cas | Pas de cookie de session créé par le code front |
| Panier | Composition, identifiants produits, quantités et prix affichés dans localStorage | Panier nécessaire à la fonctionnalité, conservé jusqu’à retrait/vidage manuel |
| Paiement | Identifiant de commande et copie du panier dans sessionStorage jusqu’au retour ; commande, adresse, montant et statut en base | Redirection Stripe Checkout en mode test ; ne pas demander de données de carte dans Florésia |
| Adresse / retrait | Adresse, téléphone optionnel, coordonnées géographiques en base ; recherche d’adresse envoyée à api-adresse.data.gouv.fr après saisie ; localisation choisie envoyée à Overpass après activation du retrait ; carte chargée depuis OpenStreetMap si affichée | Fournisseurs externes reçoivent requêtes techniques et éventuellement une adresse/recherche ou position ; véritables fleuristes OSM non partenaires de Florésia |
| Flora | Question et historique transmis à l’API ; pour les demandes non factuelles, texte transmis à l’API Gemini avec catalogue | Pas de conservation de conversation en base repérée ; limitation temporaire par IP en mémoire du serveur ; avertir de ne pas fournir de données sensibles |
| Communauté | Commentaires, avis, photos, légendes et identifiant Instagram éventuel en base ; images uploadées servies par l’API | Publications visibles publiquement ; droit à l’image / modération à préciser |
| Favoris | Association compte-produit en base | Pas de traceur marketing repéré |
| Réseaux sociaux | Liens de partage et lien Instagram | Liens externes déclenchés par clic ; aucun pixel social repéré |
| Newsletter | Ancien formulaire retiré : il affichait une réussite sans enregistrer l’email | Le lien actuel renvoie au blog ; aucun service d’abonnement ni de désinscription n’existe |

Aucun Google Analytics, pixel publicitaire ou script de suivi marketing n’a été trouvé dans les sources inspectées. localStorage et sessionStorage sont néanmoins des technologies de stockage côté navigateur. D’après la CNIL, les usages nécessaires à l’authentification et au panier peuvent être exemptés de consentement préalable, tout en exigeant une information claire. Une bannière « accepter/refuser » pour une publicité ou mesure d’audience inexistante serait trompeuse. Réévaluer si des services ou scripts sont ajoutés au déploiement.

À compléter avant publication publique : identité de l’éditrice et coordonnées, domaine, hébergeur réellement utilisé, adresse de contact pour les droits, politique de conservation et suppression effective des données, décision sur l’ouverture d’inscriptions réelles, affichage de la carte tierce et éventuels traceurs du futur hébergement. Ne pas présenter de vrais fleuristes comme partenaires de Florésia. Les CGV doivent expliciter l’absence de vente réelle dans la démonstration.

Sources de référence :
- CNIL cookies et traceurs : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite
- CNIL information des personnes : https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence
- CNIL chatbots : https://www.cnil.fr/fr/chatbots-les-conseils-de-la-cnil-pour-respecter-les-droits-des-personnes
- Service-Public, CGV : https://entreprendre.service-public.fr/vosdroits/F33527