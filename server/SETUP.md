# Database Setup Guide

## Stap 1: Voeg DATABASE_URL toe aan .env

Open het `.env` bestand in de `server` directory en voeg je Neon PostgreSQL connection string toe:

```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
PORT=3000
NODE_ENV=development
```

### Voorbeeld Neon PostgreSQL connection string:
```
postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Waar vind je deze?**
1. Ga naar je Neon dashboard: https://console.neon.tech
2. Selecteer je project
3. Klik op je database
4. Kopieer de connection string (begint met `postgresql://`)

## Stap 2: Run Prisma Migrate

Nadat je de DATABASE_URL hebt toegevoegd, run:

```bash
cd server
npm run prisma:migrate
```

Dit zal vragen om een migration naam. Bijvoorbeeld: `init_package_selection`

## Stap 3: Open Prisma Studio (optioneel)

Om je database te bekijken:

```bash
cd server
npm run prisma:studio
```

Dit opent Prisma Studio op http://localhost:5555

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Zorg dat je `.env` bestand in de `server` directory staat
- Zorg dat de DATABASE_URL regel begint met `DATABASE_URL=` (geen spaties)
- Zorg dat de connection string tussen aanhalingstekens staat

### Error: "Can't reach database server"
- Controleer of je Neon database actief is
- Controleer of de connection string correct is
- Zorg dat `?sslmode=require` aan het einde staat voor SSL

### Voor Vercel Deployment:
Voeg `DATABASE_URL` toe als Environment Variable in Vercel:
1. Ga naar je Vercel project
2. Settings → Environment Variables
3. Voeg `DATABASE_URL` toe met je Neon connection string
4. Selecteer alle environments (Production, Preview, Development)

