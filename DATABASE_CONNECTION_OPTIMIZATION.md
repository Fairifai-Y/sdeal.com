# Database Connection Optimization voor Neon

## Probleem: "Can't reach database server"

Deze error kan optreden omdat:
1. **Neon databases gaan in slaapstand** na inactiviteit (auto-pause)
2. **Connection pool timeouts** bij te veel gelijktijdige queries
3. **Network latency** tussen Vercel en Neon

## Oplossing: Optimale Connection String

### Voor Vercel (Production)

Update je `DATABASE_URL` in Vercel Environment Variables met deze parameters:

```
postgresql://username:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15
```

**Belangrijke parameters:**
- `sslmode=require` - SSL vereist voor Neon
- `connect_timeout=15` - 15 seconden om verbinding te maken (database kan in slaapstand zijn)
- `pool_timeout=15` - 15 seconden om op beschikbare connection in pool te wachten

### Stappen om te updaten in Vercel:

1. Ga naar **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**
2. Zoek `DATABASE_URL`
3. Update naar:
   ```
   postgresql://username:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15
   ```
4. **Redeploy** je project (Vercel gebruikt environment variables tijdens build)

### Voor Lokale Development

Update `server/.env` en root `.env` (als die bestaat):

```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15"
```

## Neon Database Status

### Check Database Status

1. Ga naar **Neon Dashboard**: https://console.neon.tech
2. Selecteer je project
3. Check of database **Active** is (niet paused)

### Auto-Pause Feature

Neon pauset databases automatisch na inactiviteit. Bij eerste query na pause:
- Database wordt automatisch "gewekt"
- Dit kan 2-5 seconden duren
- `connect_timeout=15` geeft genoeg tijd voor wake-up

## Troubleshooting

### Error: "Can't reach database server"

1. **Check Neon Dashboard** - Is database actief?
2. **Check connection string** - Gebruik pooler URL met `-pooler` suffix
3. **Check timeouts** - Zorg dat `connect_timeout` en `pool_timeout` zijn ingesteld
4. **Redeploy Vercel** - Environment variables worden alleen geladen tijdens build

### Error: "Connection pool timeout"

1. **Verminder concurrent queries** - Code gebruikt al semaphore (max 2 queries)
2. **Verhoog pool_timeout** - Probeer `pool_timeout=20` of `pool_timeout=30`
3. **Check Neon limits** - Free tier heeft limieten op connections

### Database blijft in slaapstand

1. **Disable auto-pause** (als mogelijk in je Neon plan)
2. **Keep-alive queries** - Run periodieke queries om database actief te houden
3. **Upgrade Neon plan** - Betaalde plannen hebben betere auto-pause handling

## Code Optimalisaties

De sync code heeft al:
- ✅ Semaphore (max 2 concurrent queries)
- ✅ Retry logic met exponential backoff
- ✅ Disconnect/reconnect bij connection errors
- ✅ Timeouts per query (15 seconden)
- ✅ Delays tussen queries

Met de geoptimaliseerde connection string zou het nu moeten werken!

