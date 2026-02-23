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

## Social login (Google, GitHub, enz.)

Social login werkt **zonder code-aanpassingen**: de bestaande `<SignIn>`- en `<SignUp>`-pagina’s tonen automatisch de knoppen voor de providers die je in het Clerk Dashboard aanzet.

### Development (lokaal / Clerk development instance)

1. Ga in het [Clerk Dashboard](https://dashboard.clerk.com) naar **User & Authentication** → **Social connections** (of **SSO connections**).
2. Kies een provider (bijv. **Google** of **GitHub**).
3. Klik op **Add connection** en kies **For all users**.
4. Zet **Enable for sign-up and sign-in** aan.
5. Opslaan. Clerk gebruikt gedeelde OAuth-credentials; je hoeft geen Client ID/Secret in te vullen.

De knoppen “Continue with Google” / “Continue with GitHub” verschijnen direct op `/sign-in` en `/sign-up`.

### Production (sdeal.com)

Voor een **production** Clerk-instance moet je bij elke provider eigen OAuth-credentials aanmaken:

**Google**

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Application type: **Web application**.
3. Authorized redirect URI: neem de **Redirect URL** over die Clerk in het Dashboard toont (bij de Google-connection, na inschakelen van “Use custom credentials”).
4. Client ID en Client Secret kopiëren en in Clerk bij Google invullen (Use custom credentials aanzetten).

**GitHub**

1. [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) → New OAuth App.
2. Authorization callback URL: de **Callback URL** uit het Clerk Dashboard (bij GitHub-connection, custom credentials).
3. Client ID en Client Secret in Clerk invullen.

Andere providers (Facebook, Apple, Microsoft, enz.): per provider bestaat een [Clerk-guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview); werkwijze is hetzelfde: redirect/callback URL uit Clerk gebruiken en Client ID/Secret in Clerk zetten.

---

## Routes

- **`/sign-in`** – Clerk sign-in (redirect na login naar `/dashboard` of eerder bezochte pagina).
- **`/sign-up`** – Clerk sign-up (redirect naar `/dashboard`).
- **`/admin`** – Alleen toegankelijk als je bent ingelogd **en** `publicMetadata.role === 'admin'`. Anders redirect naar sign-in of `/dashboard`.
- **`/dashboard`** – Alleen toegankelijk als je bent ingelogd (zowel admin als regular users). Anders redirect naar sign-in.
- Rest van de site (o.a. `/`, `/pricing`, `/package`) – open, geen login vereist.

## Legacy admin login

Als `CLERK_SECRET_KEY` niet is gezet, werkt de oude admin login nog met `ADMIN_PASSWORD`. Zodra Clerk is geconfigureerd, heeft Clerk voorrang (Bearer token wordt gecontroleerd met Clerk; legacy password blijft bruikbaar voor POST login als fallback).

## Beveiliging admin-API’s

Alleen `api/admin/auth.js` en `api/admin/overview.js` controleren nu expliciet op een geldige Clerk-/admin-sessie. Voor productie is het aan te raden om in alle andere admin-endpoints (customers, finance, ldg, mailing/*, enz.) dezelfde `requireAuth`-aanroep toe te voegen zoals in `overview.js`.
