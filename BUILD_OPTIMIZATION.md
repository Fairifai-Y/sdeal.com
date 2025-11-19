# Build Optimalisatie Analyse

## Huidige Build Tijd: ~4 minuten

### Huidige Build Stappen (vercel-build script):

```bash
npm install                                    # ~30-60 sec
cd server && npm install                      # ~30-60 sec
npm run prisma:generate                       # ~10-20 sec (server)
npm run prisma:deploy                         # ~30-60 sec ⚠️ TRAAG!
cd .. && npm run prisma:generate              # ~10-20 sec
npm run setup-images                          # ~5-10 sec
npm run build                                 # ~60-90 sec
```

**Totaal: ~175-320 seconden (3-5 minuten)**

## Problemen:

1. **`prisma:deploy` is traag** - Database migraties zijn niet nodig bij elke build
2. **Dubbele `npm install`** - Root en server worden apart geïnstalleerd
3. **`setup-images` bij elke build** - Images worden elke keer gekopieerd
4. **Geen caching** - Vercel cache wordt niet optimaal gebruikt

## Optimalisaties:

### 1. Skip Prisma Deploy (als er geen nieuwe migraties zijn)
Database migraties hoeven alleen te draaien als er nieuwe migraties zijn, niet bij elke build.

### 2. Gebruik Vercel Caching
Vercel cachet automatisch `node_modules` als de lockfiles niet veranderen.

### 3. Skip setup-images als images al bestaan
Voeg een check toe om images alleen te kopiëren als ze ontbreken.

### 4. Optimaliseer Prisma Generate
Prisma generate kan sneller met betere caching.

## Aanbevolen Optimalisaties:

1. ✅ Verwijder `prisma:deploy` uit build (run alleen handmatig of via CI/CD)
2. ✅ Voeg check toe in setup-images om te skippen als images bestaan
3. ✅ Gebruik Vercel's installCommand voor betere caching
4. ✅ Combineer Prisma generates waar mogelijk

