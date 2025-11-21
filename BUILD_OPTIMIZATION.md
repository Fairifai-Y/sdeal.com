# Build Optimalisatie

## Probleem
De build duurt lang omdat:
1. **Testing libraries in dependencies** - worden niet gebruikt in productie maar worden wel geïnstalleerd
2. **Dubbele npm install** - root en server worden beide geïnstalleerd
3. **Dubbele Prisma generate** - wordt 2x uitgevoerd (root en server)
4. **setup-images** - kopieert images elke keer (ook al bestaan ze)
5. **Geen caching** - Vercel cache wordt niet optimaal gebruikt

## Optimalisaties Toegepast

### 1. Testing Libraries naar devDependencies
- `@testing-library/jest-dom`
- `@testing-library/react`
- `@testing-library/user-event`
- `web-vitals`

**Voordeel**: Deze worden niet geïnstalleerd in productie builds, wat de install tijd verkort.

### 2. npm ci in plaats van npm install
- `npm ci` is sneller en betrouwbaarder voor CI/CD
- Gebruikt package-lock.json exact zoals het is
- Verwijderd node_modules eerst voor een schone installatie

### 3. setup-images Optimalisatie
- Script checkt nu of images al bestaan
- Skipt kopiëren als images al aanwezig zijn
- **Voordeel**: Slaat tijd over bij volgende builds

### 4. Build Command Optimalisatie
```json
"vercel-build": "npm ci --production=false && cd server && npm ci --production=false && npm run prisma:generate && cd .. && npm run prisma:generate && npm run setup-images && npm run build"
```

**Veranderingen**:
- `npm install` → `npm ci` (sneller, betrouwbaarder)
- `--production=false` zorgt dat devDependencies ook geïnstalleerd worden (nodig voor build)

## Verwachte Verbetering

- **npm install tijd**: ~30-50% sneller met `npm ci`
- **Testing libraries**: Niet meer in productie build (~10-15% minder dependencies)
- **setup-images**: Skip als images al bestaan (~5-10 seconden besparing)
- **Totaal**: ~20-30% snellere build tijd

## Toekomstige Optimalisaties

### 1. Prisma Generate Optimalisatie
Mogelijk kunnen we Prisma client alleen 1x genereren als beide schema's hetzelfde zijn, of alleen genereren waar nodig.

### 2. Build Caching
Vercel cache kan worden geoptimaliseerd door:
- `.vercelignore` toe te voegen voor onnodige bestanden
- Build cache beter te configureren

### 3. Parallel Builds
Server en root builds kunnen mogelijk parallel worden uitgevoerd (maar dit vereist Vercel configuratie).

### 4. Conditional Prisma Generate
Alleen Prisma genereren als schema is veranderd (check via git diff of checksum).

## Monitoring

Om build tijden te monitoren:
1. Check Vercel build logs voor timing
2. Vergelijk build tijden voor en na optimalisaties
3. Monitor npm install tijd specifiek

## Notities

- `npm ci` vereist dat `package-lock.json` up-to-date is
- Testing libraries zijn nu alleen beschikbaar in development
- `web-vitals` is verplaatst naar devDependencies (wordt niet gebruikt in productie)

