# Prisma Schema Consolidatie

## Wat is er veranderd?

We hebben **2 Prisma schema's geconsolideerd naar 1 schema** in de root van het project.

### Voor:
- `prisma/schema.prisma` (root) - voor API endpoints
- `server/prisma/schema.prisma` (server) - voor Express server

### Na:
- `prisma/schema.prisma` (root) - voor **alles** (API endpoints + server)

## Waarom?

1. **Eenvoudiger onderhoud** - 1 schema betekent 1 plek om wijzigingen te maken
2. **Minder verwarring** - Geen risico op verschillende schema's die uit sync raken
3. **Efficiënter** - Minder build tijd, minder duplicatie
4. **Betere performance** - 1 Prisma client instance gedeeld door alles

## Wat is er aangepast?

### 1. Migrations
- Migrations zijn verplaatst van `server/prisma/migrations/` naar `prisma/migrations/`
- Alle historische migrations zijn behouden

### 2. Server Code
- `server/routes/package.js` gebruikt nu `api/lib/prisma.js` (shared Prisma client)
- Server gebruikt dezelfde Prisma client als API endpoints

### 3. Build Scripts
- `server/package.json` scripts verwijzen nu naar root Prisma schema
- `package.json` build scripts zijn vereenvoudigd (1x prisma:generate i.p.v. 2x)

### 4. Verwijderd
- `server/prisma/` folder is verwijderd
- Duplicate schema is verwijderd

## Gebruik

### Prisma Commands

Alle Prisma commands worden nu vanuit de root uitgevoerd:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

### Server Prisma Commands

De server package.json heeft nog steeds Prisma scripts, maar ze verwijzen naar root:

```bash
cd server
npm run prisma:generate  # Voert uit: cd .. && prisma generate
npm run prisma:studio    # Voert uit: cd .. && prisma studio
```

## Environment Variables

- **Root `.env`** - bevat DATABASE_URL (gebruikt door alles)
- **Server `.env`** - bevat server-specifieke vars (PORT, etc.)

Beide moeten dezelfde DATABASE_URL hebben!

## Vercel

In Vercel moet je alleen `DATABASE_URL` instellen als Environment Variable. Deze wordt gebruikt door:
- API endpoints (`api/`)
- Server (als je die deployt)

Alles gebruikt dezelfde database en hetzelfde schema.

