# Clerk setup voor SDeal

Clerk wordt gebruikt voor accountbeheer: **admin users** (alleen `/admin`) en **regular users** (alleen `/dashboard`). De rest van de site is open.

## Environment variables

- **Frontend (lokaal + Vercel):** `REACT_APP_CLERK_PUBLISHABLE_KEY` – Publishable key uit het Clerk Dashboard.
- **Backend (Vercel / api):** `CLERK_SECRET_KEY` – Secret key uit het Clerk Dashboard.

Zet beide in je root `.env` en in **Vercel → Project → Settings → Environment Variables**.  
**Belangrijk voor Vercel:** Zonder `REACT_APP_CLERK_PUBLISHABLE_KEY` wordt de key niet in de build gestopt en krijg je een wit scherm of alleen “Inloggen is niet beschikbaar” op /sign-in, /admin, /dashboard. Voeg de variabele toe voor Production (en eventueel Preview) en redeploy.

## Clerk Dashboard

1. Maak een [Clerk](https://clerk.com) account en een Application.
2. **API Keys:** kopieer Publishable key en Secret key naar de env vars hierboven.
3. **Users:** maak gebruikers aan (sign-up of handmatig in het Dashboard).
4. **Admin aanwijzen:** voor elke admin user:
   - Ga naar Users → kies de user → **Public metadata**.
   - Voeg toe: `{ "role": "admin" }`.
   - Opslaan. Gebruikers zonder `role: "admin"` zijn regular users.

## Routes

- **`/sign-in`** – Clerk sign-in (redirect na login naar `/dashboard` of eerder bezochte pagina).
- **`/sign-up`** – Clerk sign-up (redirect naar `/dashboard`).
- **`/admin`** – Alleen toegankelijk als je bent ingelogd **en** `publicMetadata.role === 'admin'`. Anders redirect naar sign-in of `/dashboard`.
- **`/dashboard`** – Alleen toegankelijk als je bent ingelogd **en** geen admin. Anders redirect naar sign-in of `/admin`.
- Rest van de site (o.a. `/`, `/pricing`, `/package`) – open, geen login vereist.

## Legacy admin login

Als `CLERK_SECRET_KEY` niet is gezet, werkt de oude admin login nog met `ADMIN_PASSWORD`. Zodra Clerk is geconfigureerd, heeft Clerk voorrang (Bearer token wordt gecontroleerd met Clerk; legacy password blijft bruikbaar voor POST login als fallback).

## Beveiliging admin-API’s

Alleen `api/admin/auth.js` en `api/admin/overview.js` controleren nu expliciet op een geldige Clerk-/admin-sessie. Voor productie is het aan te raden om in alle andere admin-endpoints (customers, finance, ldg, mailing/*, enz.) dezelfde `requireAuth`-aanroep toe te voegen zoals in `overview.js`.
