# Admin Authentication Setup

## ✅ Geïmplementeerd: JWT Token-Based Authentication

De admin interface gebruikt nu JWT tokens voor authenticatie in plaats van een hardcoded wachtwoord.

## 🔐 Environment Variables Vereist

Je moet de volgende environment variables instellen in **Vercel**:

### 1. ADMIN_PASSWORD
Het wachtwoord voor admin login.

**Vercel Dashboard:**
- Ga naar Project → Settings → Environment Variables
- Voeg toe: `ADMIN_PASSWORD` = `jouw-veilige-wachtwoord`
- Selecteer alle environments (Production, Preview, Development)

### 2. ADMIN_JWT_SECRET (Optioneel, maar aanbevolen)
Een geheime sleutel voor JWT token signing. Als niet ingesteld, wordt een default gebruikt (niet veilig voor productie).

**Vercel Dashboard:**
- Voeg toe: `ADMIN_JWT_SECRET` = `een-lange-willekeurige-string-minimaal-32-karakters`
- Gebruik een password generator voor een veilige secret

**Voorbeeld:**
```
ADMIN_JWT_SECRET=your-super-secret-key-minimum-32-characters-long-for-security
```

## 📋 Stappen om te Activeren

1. **Installeer dependencies:**
   ```bash
   cd server
   npm install
   ```
   Dit installeert `jsonwebtoken` package.

2. **Set Environment Variables in Vercel:**
   - `ADMIN_PASSWORD` - Je admin wachtwoord
   - `ADMIN_JWT_SECRET` - Een veilige random string (minimaal 32 karakters)

3. **Redeploy:**
   - Environment variables worden alleen geladen tijdens build
   - Ga naar Vercel Dashboard → Deployments → Redeploy laatste deployment

## 🔒 Hoe het Werkt

### Login Flow:
1. Gebruiker voert wachtwoord in
2. Frontend stuurt wachtwoord naar `/api/admin/auth` (POST)
3. Server verifieert wachtwoord tegen `ADMIN_PASSWORD`
4. Bij succes: Server genereert JWT token
5. Frontend slaat token op in `localStorage`
6. Alle volgende requests gebruiken token in `Authorization: Bearer <token>` header

### Authenticated Requests:
- Alle `/api/admin/*` endpoints vereisen nu authenticatie
- Token wordt automatisch meegestuurd in `Authorization` header
- Server valideert token bij elke request
- Bij invalid/expired token: gebruiker wordt automatisch uitgelogd

### Token Expiry:
- Tokens verlopen na 24 uur (standaard)
- Kan worden aangepast via `ADMIN_JWT_EXPIRY` environment variable
- Format: `'24h'`, `'7d'`, `'30d'`, etc.

## 🛡️ Beveiliging Verbeteringen

### Voor:
- ❌ Wachtwoord hardcoded in frontend code
- ❌ Zichtbaar in browser DevTools
- ❌ Geen server-side validatie
- ❌ API endpoints onbeveiligd

### Na:
- ✅ Wachtwoord alleen op server (environment variable)
- ✅ JWT tokens voor sessies
- ✅ Server-side validatie op alle endpoints
- ✅ Tokens verlopen automatisch
- ✅ Automatische logout bij invalid token

## 🔧 Lokale Development

Voor lokale development, voeg toe aan `server/.env`:

```env
ADMIN_PASSWORD=your-local-password
ADMIN_JWT_SECRET=your-local-secret-key-minimum-32-characters
```

## 🚨 Belangrijk

1. **Verander het default wachtwoord!** Zet `ADMIN_PASSWORD` in Vercel
2. **Gebruik een sterke JWT secret!** Minimaal 32 karakters, willekeurig
3. **Redeploy na het instellen van environment variables!**
4. **Test de login** na deployment

## 📝 API Endpoints

### POST `/api/admin/auth`
Login endpoint. Verstuurt wachtwoord, ontvangt JWT token.

**Request:**
```json
{
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### GET `/api/admin/auth`
Verify token endpoint. Checkt of token nog geldig is.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

## 🔍 Troubleshooting

### "Admin authentication is not configured"
- `ADMIN_PASSWORD` is niet ingesteld in Vercel
- Zet `ADMIN_PASSWORD` environment variable en redeploy

### "Invalid or expired token"
- Token is verlopen (na 24 uur)
- Log opnieuw in

### "Authentication required"
- Geen token in request
- Check of token correct wordt meegestuurd in `Authorization` header

### Login werkt niet
- Check Vercel logs voor errors
- Verify dat `ADMIN_PASSWORD` correct is ingesteld
- Check dat er een redeploy is gedaan na het instellen van environment variables

