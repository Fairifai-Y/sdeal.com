# Magento Sync Systeem - Nieuw (Gebaseerd op Werkend Project)

## Overzicht

Het sync systeem is volledig herschreven naar het patroon van het werkende project:
- ✅ **Simpel en sequentieel** - geen complexiteit
- ✅ **Watermark systeem** - voor dagelijkse incrementele syncs
- ✅ **PurchaseDate check** - betere duplicaat preventie
- ✅ **Kleine batches** - 10 orders per keer

## Database Schema

### Consumer Model (Aangepast)

```prisma
model Consumer {
  email             String
  purchaseDate      DateTime? // Date of first purchase
  // ... andere velden
  
  @@unique([email, purchaseDate]) // Uniek op email + purchaseDate
}
```

**Belangrijk:**
- Dezelfde email met verschillende purchaseDate = verschillende consumers
- Dezelfde email metzelfde purchaseDate = duplicaat (wordt overgeslagen)

### SyncStatus Model (Nieuw)

```prisma
model SyncStatus {
  syncType          String   // "full" or "incremental"
  lastEntityId      Int?     // Watermark: laatste verwerkte order entity_id
  lastSyncAt        DateTime?
  status            String   // stopped, running, error
  totalProcessed    Int
  totalCreated      Int
  totalErrors       Int
}
```

**Watermark systeem:**
- `lastEntityId` = laatste verwerkte Magento order entity_id
- Bij volgende sync: start vanaf `lastEntityId + 1`
- Alleen nieuwe orders worden gesynct

## Sync Flow

### 1. Eerste Sync (Full Sync - Alle Klanten)

```javascript
POST /api/admin/mailing/sync-customers
{
  "fullSync": true,
  "testMode": false
}
```

**Wat gebeurt er:**
1. Haalt ALLE orders op uit Magento
2. Converteert orders naar consumers
3. Check duplicaten (email + purchaseDate)
4. Maakt nieuwe consumers aan
5. Slaat watermark op (hoogste entity_id)

### 2. Dagelijkse Sync (Incremental - Alleen Nieuwe Klanten)

```javascript
POST /api/admin/mailing/sync-customers
{
  "fullSync": false,  // of weglaten (default = false)
  "testMode": false
}
```

**Wat gebeurt er:**
1. Haalt laatste watermark op (`lastEntityId`)
2. Haalt alleen orders op vanaf `lastEntityId + 1`
3. Converteert nieuwe orders naar consumers
4. Check duplicaten (email + purchaseDate)
5. Maakt nieuwe consumers aan
6. Update watermark naar nieuwe hoogste entity_id

## Code Patroon (Zoals Werkend Project)

### Simpel en Sequentieel

```javascript
// Voor elke order, simpel en direct:
for (const order of orders) {
  // 1. Converteer order naar consumer data
  const consumerData = convertOrderToConsumer(order);
  
  // 2. Check of bestaat (email + purchaseDate)
  const existing = await prisma.consumer.findFirst({
    where: {
      email: consumerData.email,
      purchaseDate: consumerData.purchaseDate
    }
  });
  
  // 3. Als niet bestaat, create
  if (!existing) {
    await prisma.consumer.create({ data: consumerData });
  }
}
```

**Geen complexiteit:**
- ❌ Geen semaphore
- ❌ Geen timeouts
- ❌ Geen retries
- ❌ Geen delays (behalve minimale 500ms tussen pages)
- ❌ Geen batches processing

## API Endpoints

### Start Sync

**POST** `/api/admin/mailing/sync-customers`

**Body:**
```json
{
  "fullSync": false,        // true = alle orders, false = alleen nieuwe
  "testMode": false,        // true = max 1 page (10 orders)
  "batchSize": 10,          // Orders per page (klein zoals werkend project)
  "maxPages": null,         // null = alle pages
  "storeMapping": {}        // Map website_id naar store code
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync started",
  "data": {
    "status": "started",
    "mode": "incremental",
    "testMode": false
  }
}
```

### Check Sync Status

**GET** `/api/admin/mailing/sync-customers`

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "progress": {
      "total": 150,
      "processed": 150,
      "created": 150,
      "errors": 0
    },
    "dbSyncStatus": [
      {
        "syncType": "incremental",
        "lastEntityId": 50000,
        "lastSyncAt": "2025-11-22T10:00:00Z",
        "status": "stopped",
        "totalCreated": 150
      }
    ]
  }
}
```

## Gebruik

### Eerste Keer: Alle Klanten Binnenhalen

```bash
curl -X POST http://localhost:3000/api/admin/mailing/sync-customers \
  -H "Content-Type: application/json" \
  -d '{"fullSync": true}'
```

Dit haalt ALLE orders op en maakt consumers aan.

### Dagelijks: Alleen Nieuwe Klanten

```bash
curl -X POST http://localhost:3000/api/admin/mailing/sync-customers \
  -H "Content-Type: application/json" \
  -d '{"fullSync": false}'
```

Dit haalt alleen nieuwe orders op (vanaf laatste watermark).

### Test Mode

```bash
curl -X POST http://localhost:3000/api/admin/mailing/sync-customers \
  -H "Content-Type: application/json" \
  -d '{"testMode": true}'
```

Dit sync max 10 orders (1 page) voor testing.

## Mailflow Opzetten

Na sync kunnen nieuwe consumers worden gebruikt voor mailflows:

1. **Check nieuwe consumers:**
   ```javascript
   const newConsumers = await prisma.consumer.findMany({
     where: {
       source: 'magento_sync',
       createdAt: {
         gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Laatste 24 uur
       }
     }
   });
   ```

2. **Trigger mailflow voor nieuwe consumers:**
   - Gebruik `EmailWorkflow` met trigger `consumer_signup`
   - Of maak custom workflow voor nieuwe Magento consumers

## Migration

Run deze migration om database schema bij te werken:

```bash
cd server
npm run prisma:migrate
```

Migration naam: `add_purchase_date_and_sync_status`

## Voordelen van Nieuw Systeem

1. ✅ **Simpel** - Geen over-engineering
2. ✅ **Betrouwbaar** - Sequentieel = geen connection pool issues
3. ✅ **Efficiënt** - Watermark = alleen nieuwe orders
4. ✅ **Schaalbaar** - Kleine batches = minder memory
5. ✅ **Duplicaat preventie** - Email + purchaseDate check

## Verschil met Oude Implementatie

| Feature | Oude (Complex) | Nieuwe (Simpel) |
|---------|----------------|-----------------|
| Semaphore | ✅ Max 2 concurrent | ❌ Geen |
| Timeouts | ✅ 15 seconden | ❌ Geen |
| Retries | ✅ 3x met backoff | ❌ Geen |
| Delays | ✅ 300ms + 2s | ✅ 500ms tussen pages |
| Batches | ✅ 10 customers | ❌ Direct processing |
| Watermark | ❌ Geen | ✅ Ja |
| PurchaseDate | ❌ Geen | ✅ Ja |
| Updates | ✅ Update bestaande | ❌ Alleen creates |

## Troubleshooting

### Sync stopt niet
- Check `maxPages` limiet
- Check Magento API rate limits

### Geen nieuwe consumers
- Check watermark (`lastEntityId`)
- Check of er nieuwe orders zijn in Magento
- Check logs voor errors

### Duplicaten
- Check of `purchaseDate` correct wordt gezet
- Check database constraint werkt

