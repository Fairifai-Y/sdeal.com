# Database Setup voor Vercel

## Eén Prisma Schema

Er is **1 Prisma schema** in dit project:
- `prisma/schema.prisma` (root) - gebruikt door API endpoints (`api/`) en server (`server/`)

Alle code gebruikt dezelfde Prisma client via `api/lib/prisma.js`.

## Oplossing

### 1. Vercel Environment Variables

Zorg dat `DATABASE_URL` in Vercel is ingesteld:
1. Ga naar Vercel Dashboard → Project → Settings → Environment Variables
2. Voeg `DATABASE_URL` toe met de **pooler URL**:
   ```
   postgresql://user:password@ep-cold-dawn-aba86905-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Belangrijk**: Gebruik de **pooler URL** (met `-pooler` in de hostname) voor serverless
4. Zorg dat `?sslmode=require` aan het einde staat
5. Selecteer **alle environments** (Production, Preview, Development)

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

