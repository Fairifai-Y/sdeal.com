# Lokale Testing van Sync Customers

Je kunt de sync functie nu lokaal testen zonder Vercel deployment te wachten!

## Optie 1: Via Express Server (Aanbevolen)

### Stap 1: Start de server

```bash
cd server
npm run dev
```

### Stap 2: Test via HTTP

**Test mode (max 100 orders):**
```bash
curl -X POST http://localhost:3000/api/admin/mailing/sync-customers \
  -H "Content-Type: application/json" \
  -d '{"testMode": true}'
```

**Full sync:**
```bash
curl -X POST http://localhost:3000/api/admin/mailing/sync-customers \
  -H "Content-Type: application/json" \
  -d '{"testMode": false}'
```

**Check status:**
```bash
curl http://localhost:3000/api/admin/mailing/sync-customers
```

### Stap 3: Of gebruik de UI

1. Start de React app (als die lokaal draait)
2. Ga naar Admin → Mailing → Consumers
3. Klik op "Test Import" of "Start Sync"
4. De requests gaan naar `localhost:3000` in plaats van Vercel

## Optie 2: Direct Script (Sneller)

### Run test script

```bash
cd server
npm run test:sync
```

Of direct:
```bash
cd server
node test-sync.js
```

Dit runt de sync direct zonder HTTP server. Perfect voor snelle tests!

## Environment Variables

Zorg dat je `.env` bestand in `server/` directory staat met:

```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15"
MAGENTO_BEARER_TOKEN="your-token"
MAGENTO_API_BASE_URL="https://www.sdeal.nl/rest/V1"
PROXY_BASE_URL="https://caityapps.com/proxy"
PROXY_SECRET="your-secret"
```

## Troubleshooting

### Error: "Cannot find module '../api/admin/mailing/sync-customers'"

Zorg dat je in de `server/` directory bent:
```bash
cd server
node test-sync.js
```

### Error: "DATABASE_URL not found"

1. Check of `server/.env` bestaat
2. Check of `DATABASE_URL` correct is ingesteld
3. Run `node check-env.js` om te verifiëren

### Error: "Can't reach database server"

1. Check of de database actief is in Neon Dashboard
2. Check of de connection string correct is (met timeout parameters)
3. Zie `DATABASE_CONNECTION_OPTIMIZATION.md` voor details

## Voordelen van Lokale Testing

✅ **Geen deployment nodig** - Test direct
✅ **Sneller** - Geen 7 minuten wachten
✅ **Betere debugging** - Zie logs direct in terminal
✅ **Snellere iteratie** - Test → Fix → Test

## Tips

- Gebruik `testMode: true` voor snelle tests (max 100 orders)
- Check de terminal logs voor gedetailleerde output
- Gebruik `npm run dev` voor auto-reload bij code changes

