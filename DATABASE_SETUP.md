# Database Setup voor Vercel

## Eén Prisma Schema

Er is **1 Prisma schema** in dit project:
- `prisma/schema.prisma` (root) - gebruikt door API endpoints (`api/`) en server (`server/`)

Alle code gebruikt dezelfde Prisma client via `api/lib/prisma.js`.

## Oplossing

### 1. Vercel Environment Variables

Zorg dat `DATABASE_URL` in Vercel is ingesteld:
1. Ga naar Vercel Dashboard → Project → Settings → Environment Variables
2. Voeg `DATABASE_URL` toe met de **pooler URL** en timeout parameters:
   ```
   postgresql://neondb_owner:npg_dODNHU7js2SY@ep-cold-dawn-aba86905-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15
   ```
3. **Belangrijk**: 
   - Gebruik de **pooler URL** (met `-pooler` in de hostname) voor serverless
   - `sslmode=require` - SSL vereist voor Neon
   - `connect_timeout=15` - 15 seconden om verbinding te maken (database kan in slaapstand zijn)
   - `pool_timeout=15` - 15 seconden om op beschikbare connection in pool te wachten
4. Selecteer **alle environments** (Production, Preview, Development)
5. **Redeploy** na het updaten van environment variables

### 2. Lokale Setup

- `server/.env` - heeft de DATABASE_URL (correct geconfigureerd ✅)
- Root `.env` - bestaat niet (niet nodig, Vercel gebruikt environment variables)

### 3. Prisma Studio

Open Prisma Studio:
```bash
npx prisma studio
```

Dit opent Prisma Studio op http://localhost:5555 met alle models uit het root schema.

### 4. Build Process

Tijdens de build wordt de Prisma client één keer gegenereerd:
- `npm run prisma:generate` (genereert vanuit `prisma/schema.prisma`)

Deze gebruikt `process.env.DATABASE_URL`, dus zorg dat deze in Vercel correct is ingesteld!

## Check

Run dit script om te controleren:
```bash
cd server
node check-env.js
```

Dit controleert of de DATABASE_URL correct is geconfigureerd.

