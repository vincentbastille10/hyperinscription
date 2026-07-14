# HyperInscription — Spectra Media AI

Clone produit d’HyperBetty dédié aux inscriptions d’associations et d’entreprises.

## Parcours

1. HyperScript cible une activité et une ville, trouve puis qualifie les sites.
2. `/api/demo/generate` crawle le site et crée une démo privée valable 7 jours.
3. HyperScript envoie le mail FR ou EN avec le bouton « Je veux ça ».
4. Stripe active un abonnement mensuel, annuel ou un achat définitif.
5. Le webhook Stripe crée une URL permanente et envoie l’email d’activation.
6. Chaque inscription est enregistrée, envoyée par Mailjet et transmise au Google Sheet optionnel.

## Briques incluses

- Landing commerciale 59 €/mois, 566,40 €/an (–20 %) et achat définitif sur devis.
- Formulaire générique personnalisable par organisation.
- Emails de prospection FR et EN.
- Lanceur visuel HyperScript avec activités cliquables et autocomplétion des villes.
- Dashboard centré sur les signaux Mailjet.
- API REST protégée par token pour HyperScript.
- Bridge Python standard-library : `scripts/hyperscript_bridge.py`.
- Connecteur Google Apps Script générique : `integrations/google_apps_script_generic.gs`.
- Stripe Checkout, webhook d’activation et Mailjet transactionnel.

## Variables de production

Les clés attendues sont listées dans `.env.example`. Elles doivent être configurées dans l’environnement d’hébergement, jamais commitées.

## Contrat HyperScript

- `POST /api/hyperscript/run` : crée ou met à jour un run.
- `POST /api/demo/generate` : crawle et génère une démo + le mail associé.
- `POST /api/hyperscript/prospect` : remonte les statuts et signaux.
- En-tête : `Authorization: Bearer <HYPERINSCRIPTION_API_TOKEN>`.
