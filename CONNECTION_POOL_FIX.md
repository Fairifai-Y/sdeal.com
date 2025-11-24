# Connection Pool Timeout Fix

## Probleem
De online sync gaf om de ~5 records connection pool timeout errors:
- "Timed out fetching a new connection from the connection pool"
- "Can't reach database server"

## Oplossingen Geïmplementeerd

### 1. ✅ Direct Create i.p.v. FindFirst + Create
**Voor:** 2 queries per order (`findFirst` + `create`)
**Na:** 1 query per order (`create` met unique constraint check)

**Voordeel:** Halveert het aantal database queries, minder druk op connection pool

### 2. ✅ Retry Logic met Exponential Backoff
**Implementatie:**
- 3 retries voor connection errors
- Exponential backoff: 1s, 2s, 4s
- Alleen voor connection pool errors (niet voor unique constraint errors)

**Voordeel:** Tijdelijke connection problemen worden automatisch opgelost

### 3. ✅ Delays tussen Queries
**Implementatie:**
- 100ms delay elke 5 queries
- Balanceert snelheid en betrouwbaarheid

**Voordeel:** Geeft connection pool tijd om connections vrij te geven

## Nog Te Doen: DATABASE_URL Aanpassen

De `pool_timeout` in de DATABASE_URL moet worden verhoogd van 15s naar 20-30s.

### Stappen:

1. **Ga naar Vercel Dashboard:**
   - Project → Settings → Environment Variables

2. **Zoek `DATABASE_URL` en update naar:**
   ```
   postgresql://username:password@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=25
   ```
   
   **Belangrijk:** Verander alleen `pool_timeout=15` naar `pool_timeout=25`

3. **Redeploy:**
   - Environment variables worden alleen geladen tijdens build
   - Ga naar Deployments → Redeploy laatste deployment

## Verwachte Resultaten

Na deze fixes zou je moeten zien:
- ✅ Minder connection pool timeout errors
- ✅ Automatische retries bij tijdelijke problemen
- ✅ Betere performance (minder queries)
- ✅ Minder errors om de 5 records

## Monitoring

Check de logs voor:
- `⚠️ Connection error for order X, retrying...` - Retry wordt uitgevoerd
- `✅ Created X customers so far...` - Normale voortgang
- Minder `❌ Order X: Error` berichten

## Troubleshooting

Als er nog steeds errors zijn:
1. Check of DATABASE_URL correct is geüpdatet in Vercel
2. Check of er een redeploy is gedaan na DATABASE_URL update
3. Overweeg `pool_timeout` verder te verhogen naar 30s
4. Check Neon dashboard voor database status

