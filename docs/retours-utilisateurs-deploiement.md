# Publication des améliorations du parcours

Les migrations `20261013010000_order_delivery_date`, `20261013010100_order_confirmation` et `20261013010200_order_stripe_document` ajoutent trois colonnes facultatives à Order. Les données existantes sont conservées. La dernière mémorise la session Stripe du paiement pour permettre de retrouver le document depuis le compte.

Avant de démarrer la nouvelle API sur un environnement identifié et sauvegardé :

```powershell
npx prisma migrate deploy
npx prisma generate
npm run typecheck
npm run lint:check
npm run test:cov
npm run test:e2e -- --runInBand
npm run build
```

Exécuter les commandes séparément. Ne pas démarrer l'API modifiée avant l'application des migrations. Le domaine Resend doit être validé et MAIL_FROM doit désigner un expéditeur autorisé. La confirmation est envoyée après vérification de la signature Stripe, de la devise et du montant. Une date mémorisée en base évite de renvoyer une confirmation déjà enregistrée. La clé d'idempotence Resend protège aussi les essais rapprochés ; après sa période de validité, une interruption entre l'envoi et l'enregistrement nécessiterait une vérification du journal Resend avant une relance manuelle.

Vérification finale après publication : inscription sans téléphone, ajout d'une adresse sans libellé depuis le panier, restauration d'une composition, date de simulation, paiement Stripe de test, panier mis à jour, email reçu une seule fois, événement répété sans second email. Ne pas utiliser de carte réelle.

Les nouvelles sessions de paiement demandent la création d'une facture Stripe. Le bouton de consultation des commandes payées ouvre la facture hébergée, ou le reçu si aucune facture n'existe. Pour les anciennes commandes sans référence de session, la récupération essaie les 100 sessions les plus récentes depuis la création de la commande. Une ancienne commande peut donc ne pas disposer de document récupérable ; aucun lien n'est inventé.

Le ZIP destiné à Hostinger contient uniquement le front-end compilé. Publier également les modifications de l'API sur Render après les migrations pour activer les factures, le téléphone de livraison, les emails et les exemples Swagger. Les secrets restent dans les variables d'environnement du serveur et ne doivent pas être placés dans public_html.
