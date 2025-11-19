# Build Optimalisatie - Samenvatting

## ✅ Uitgevoerde Optimalisaties

### 1. Prisma Deploy Verwijderd uit Standaard Build
**Besparing: ~30-60 seconden**

- `prisma:deploy` (database migraties) is verwijderd uit de standaard `vercel-build` script
- Database migraties zijn niet nodig bij elke build
- Nieuwe script toegevoegd: `vercel-build:with-migrations` voor wanneer migraties wel nodig zijn

**Gebruik:**
- Normale builds: `npm run vercel-build` (zonder migraties)
- Met migraties: `npm run vercel-build:with-migrations` (alleen wanneer nodig)

### 2. Setup Images Optimalisatie
**Besparing: ~5-10 seconden**

- Script checkt nu of images al bestaan voordat ze gekopieerd worden
- Skip copy operatie als images al aanwezig zijn
- Voorkomt onnodige file I/O operaties

### 3. Vercel Config Optimalisatie
- `installCommand` toegevoegd voor betere caching
- Vercel kan nu `node_modules` beter cachen tussen builds

## 📊 Geschatte Tijd Besparing

| Stap | Voor | Na | Besparing |
|------|------|-----|-----------|
| Prisma Deploy | 30-60s | 0s | **30-60s** |
| Setup Images | 5-10s | 1-2s | **3-8s** |
| **Totaal** | **~4 min** | **~2.5-3 min** | **~1-1.5 min** |

## 🚀 Verwachte Build Tijd

**Voor:** ~4 minuten (240 seconden)
**Na:** ~2.5-3 minuten (150-180 seconden)
**Besparing:** ~30-40% sneller

## 📝 Belangrijke Notities

### Database Migraties
Database migraties (`prisma:deploy`) moeten handmatig worden uitgevoerd wanneer:
- Er nieuwe Prisma migrations zijn toegevoegd
- De database schema is veranderd

**Hoe migraties uitvoeren:**
1. Via Vercel CLI: `vercel env pull` en dan `npm run vercel-build:with-migrations`
2. Of voer handmatig uit: `cd server && npm run prisma:deploy`

### Vercel Caching
Vercel cachet automatisch:
- `node_modules` (als `package-lock.json` niet verandert)
- Build artifacts tussen deployments

Dit betekent dat builds nog sneller worden bij volgende deployments als dependencies niet veranderen.

## 🔍 Monitoring

Controleer de build tijd in Vercel dashboard:
1. Ga naar je project
2. Klik op "Deployments"
3. Bekijk de build tijd van de laatste deployment

De build tijd zou nu significant lager moeten zijn!

