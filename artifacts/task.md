# Intégration Wave Checkout

- `[/]` Informer l'utilisateur sur la configuration de la clé API Wave (Checkout API + Signature).
- `[x]` **Backend : Module Wave**
  - `[x]` Créer `wave.service.ts` pour appeler l'API Checkout.
  - `[x]` Créer `wave.controller.ts` pour écouter et vérifier les Webhooks (`rawBody` + `HMAC-SHA256`).
  - `[x]` Créer `wave.module.ts` et l'importer dans `app.module.ts`.
- `[x]` **Backend : Mise à jour Billing**
  - `[x]` Modifier `billing.service.ts` pour déclencher la session Wave.
  - `[x]` Modifier le Prisma Schema si nécessaire (stocker l'URL Wave ou utiliser `transactionId`).
- `[x]` **Frontend : Caisse**
  - `[x]` Modifier `caisse/page.tsx` pour générer et afficher le lien de paiement Wave.
  - `[x]` Écouter les WebSockets pour détecter le paiement réussi et fermer la modale.
- `[ ]` **Frontend : SMS / WhatsApp (Optionnel)**
  - `[ ]` Ajouter un bouton pour envoyer le lien Wave par SMS via notre module `SmsService`.
