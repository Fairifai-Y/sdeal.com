# Prisma Retry Wrapper - Centrale Oplossing voor Connection Pool Timeouts

## Overzicht

De `prisma-with-retry.js` wrapper is een centrale oplossing die automatisch retry logic toevoegt aan alle Prisma database queries. Dit voorkomt connection pool timeouts in serverless omgevingen (zoals Vercel) zonder dat je handmatig retry logic hoeft toe te voegen aan elke query.

## Probleem

In serverless omgevingen kunnen database connection pool timeouts optreden wanneer:
- De database in slaapstand is (Neon auto-suspend)
- Te veel gelijktijdige queries de connection pool uitputten
- Netwerkproblemen optreden

## Oplossing

De wrapper voegt automatisch toe:
- **Automatische retry logic** met exponential backoff (1s, 2s, 4s)
- **Database wake-up** voordat een retry wordt gedaan
- **Intelligente error detection** - alleen connection errors worden geretried
- **Transparant gebruik** - werkt als een normale Prisma client

## Gebruik

### Basis Gebruik

Vervang `require('./lib/prisma')` met `require('./lib/prisma-with-retry')`:

```javascript
// Voor
const prisma = require('../../lib/prisma');

// Na
const prisma = require('../../lib/prisma-with-retry');

// Gebruik normaal - retry logic wordt automatisch toegevoegd
const consumer = await prisma.consumer.findFirst({ 
  where: { email: 'test@example.com' } 
});

await prisma.consumer.create({ 
  data: { email: 'new@example.com', firstName: 'John' } 
});
```

### Welke Errors Worden Geretried?

De wrapper retried automatisch bij:
- `Timed out fetching a new connection` - Connection pool timeout
- `Can't reach database server` - Database niet bereikbaar
- `ECONNRESET` - Connection reset
- `ETIMEDOUT` - Connection timeout
- `ENOTFOUND` - DNS/Network error
- Prisma error codes: `P1001`, `P2024`, `P1017`

### Retry Configuratie

De wrapper gebruikt standaard:
- **Max retries**: 3
- **Delays**: 1000ms, 2000ms, 4000ms (exponential backoff)
- **Database wake-up**: Ja (probeert database wakker te maken voor retry)

## Bestanden die de Wrapper Gebruiken

De volgende bestanden gebruiken nu de wrapper:

1. **`api/admin/mailing/sync-customers.js`**
   - Sync van Magento orders naar database
   - Handmatige retry logic verwijderd, nu automatisch

2. **`api/admin/mailing/campaigns.js`**
   - Email campaign sending
   - `retryDbOperation` functie verwijderd, nu automatisch

## Migratie van Bestaande Code

### Stap 1: Update Import

```javascript
// Oud
const prisma = require('../../lib/prisma');

// Nieuw
const prisma = require('../../lib/prisma-with-retry');
```

### Stap 2: Verwijder Handmatige Retry Logic

```javascript
// Oud - met handmatige retry
let retries = 3;
while (retries > 0) {
  try {
    await prisma.consumer.create({ data });
    break;
  } catch (error) {
    if (isConnectionError(error) && retries > 1) {
      await delay(1000);
      retries--;
    } else {
      throw error;
    }
  }
}

// Nieuw - automatisch
await prisma.consumer.create({ data });
```

### Stap 3: Verwijder Database Wake-up Code

```javascript
// Oud - handmatige wake-up
try {
  await prisma.$queryRaw`SELECT 1`;
} catch (wakeError) {
  // Handle error
}

// Nieuw - automatisch (geen code nodig)
```

## Voordelen

1. **Minder Code** - Geen handmatige retry logic meer nodig
2. **Consistentie** - Alle queries gebruiken dezelfde retry strategie
3. **Onderhoudbaarheid** - Retry logic op één plek
4. **Betrouwbaarheid** - Automatische handling van connection errors
5. **Transparant** - Werkt als normale Prisma client

## Technische Details

De wrapper gebruikt JavaScript `Proxy` om alle Prisma model delegates (zoals `consumer`, `emailCampaign`, etc.) te wrappen. Alle async methods (findMany, findFirst, create, update, etc.) worden automatisch gewrapped met retry logic.

Voor `$` methods (zoals `$queryRaw`, `$transaction`) worden ook automatisch gewrapped.

## Performance

- **Geen overhead** voor succesvolle queries
- **Minimale overhead** voor retries (alleen bij connection errors)
- **Automatische backoff** voorkomt database overload

## Troubleshooting

### Wrapper werkt niet

1. Controleer of je `prisma-with-retry` importeert in plaats van `prisma`
2. Controleer of de wrapper correct is geïnstalleerd
3. Check logs voor retry berichten (alleen in development mode)

### Te veel retries

Als je te veel retries ziet, kan dit betekenen:
- Database is niet bereikbaar
- Connection pool is uitgeput
- Network problemen

Check de database status en connection pool configuratie.

## Toekomstige Verbeteringen

Mogelijke verbeteringen:
- Configuratie via environment variables
- Metrics/logging voor retry statistics
- Custom retry strategies per query type
- Circuit breaker pattern voor herhaalde failures

