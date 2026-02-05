# Environment Variables Setup

## Locatie van .env bestanden

Er zijn **2 .env bestanden** nodig:

### 1. Root `.env` (voor API endpoints en server)
**Locatie:** `/.env` (in de root van het project)

Deze wordt gebruikt door:
- API endpoints in `api/` folder
- Express server in `server/` folder
- **Eén Prisma schema** (`prisma/schema.prisma`) - gebruikt door alles

### 2. Server `.env` (voor server-specifieke config)
**Locatie:** `/server/.env`

Deze wordt gebruikt door:
- Express server in `server/` folder (voor PORT, etc.)
- **Gebruikt dezelfde DATABASE_URL als root .env**

## Setup Instructies

### Stap 1: Maak root `.env` bestand

Maak een `.env` bestand in de root van het project met:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@ep-cold-dawn-aba86905-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Seller Admin API Configuration
SELLER_ADMIN_ACCESS_TOKEN="your-access-token-here"
SELLER_ADMIN_API_BASE_URL="https://www.sdeal.nl/rest/V1"

# Proxy Configuration (optional)
PROXY_BASE_URL="https://caityapps.com/proxy"
PROXY_SECRET="your-proxy-secret-here"

# Magento API Configuration (optional)
MAGENTO_BEARER_TOKEN=""
MAGENTO_API_BASE_URL="https://www.sdeal.nl/rest/V1"

# SendGrid Email Configuration (optional)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"        # Verzenderadres voor alle e-mails
NOTIFICATION_EMAIL="admin@yourdomain.com"   # Ontvanger van o.a. "Betaling geslaagd"-notificatie

# Mollie Payment Configuration (optional)
MOLLIE_API_KEY="your-mollie-api-key"
```

### Stap 2: Kopieer DATABASE_URL naar root `.env`

Kopieer de DATABASE_URL uit `server/.env` naar de root `.env`:

```bash
# Windows PowerShell
$dbUrl = (Get-Content server\.env | Select-String "DATABASE_URL").Line
Add-Content .env $dbUrl
```

Of kopieer handmatig de DATABASE_URL regel van `server/.env` naar root `.env`.

### Stap 3: Vercel Environment Variables

**Belangrijk:** Vercel gebruikt **GEEN** .env bestanden! Je moet environment variables instellen in Vercel:

1. Ga naar Vercel Dashboard → Project → Settings → Environment Variables
2. Voeg alle variabelen toe (zie hierboven)
3. **Gebruik de pooler URL** voor DATABASE_URL (met `-pooler` in hostname)
4. Selecteer **alle environments** (Production, Preview, Development)

## Belangrijk

- **Lokaal:** Gebruik `.env` bestanden (root en server/)
- **Vercel:** Gebruik Environment Variables in Vercel Dashboard
- **Er is nu maar 1 Prisma schema** in `prisma/schema.prisma` (root)
- **Beide .env bestanden moeten dezelfde DATABASE_URL gebruiken!**

## Check

Run dit om te controleren:
```bash
cd server
node check-env.js
```

Dit controleert of de DATABASE_URL correct is geconfigureerd.

