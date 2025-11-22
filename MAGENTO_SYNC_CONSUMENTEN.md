# Magento Sync - Consumenten Opslag Uitleg

Dit document legt uit hoe consumenten worden opgeslagen in de database na een Magento sync.

## Overzicht

Het systeem haalt orders op uit Magento via de API, converteert deze naar consumenten (customers), en slaat ze op in de PostgreSQL database via Prisma. Er zijn twee manieren waarop de sync kan worden uitgevoerd:

1. **Handmatige sync** via `/api/magento/auto-sync` (POST)
2. **Automatische cron sync** via `/api/cron/auto-sync` (GET)

## Database Schema

### Customer Model (Prisma)

```prisma
model Customer {
  id               String             @id @default(cuid())
  websiteId        String
  name             String
  email            String
  productName      String?
  purchaseDate     DateTime?
  status           EmailStatus        @default(PENDING)
  lastContact      DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  website          Website            @relation(fields: [websiteId], references: [id])
  emailSendHistory EmailSendHistory[]

  @@unique([websiteId, email])
}
```

**Belangrijke constraints:**
- `@@unique([websiteId, email])` - Een email kan maar één keer voorkomen per website
- `status` heeft default waarde `PENDING`

## Sync Flow

### Stap 1: Initiatie

**Handmatige sync** (`app/api/magento/auto-sync/route.ts`):
- Gebruiker triggert sync via POST request
- Controleert of website bestaat en auto-upload is ingeschakeld
- Controleert of er niet al een sync bezig is (status `RUNNING`)
- Update status naar `RUNNING`

**Cron sync** (`app/api/cron/auto-sync/route.ts`):
- Cron job loopt periodiek (bijv. elke 6 uur)
- Haalt alle websites op waar `magentoAutoUploadEnabled = true`
- Controleert of het interval is verstreken sinds laatste run
- Update status naar `RUNNING`

### Stap 2: Magento Client Initialisatie

```typescript
const magentoClient = new MagentoApiClient({
  apiUrl: website.magentoApiUrl!,
  bearerToken: website.magentoBearerToken || undefined,
  apiKey: website.magentoApiKey || undefined,
  apiSecret: website.magentoApiSecret || undefined,
  storeId: website.magentoStoreId ? Number(website.magentoStoreId) : undefined,
});
```

### Stap 3: Store Matching

Het systeem matcht automatisch de juiste Magento store op basis van het website domein:

```typescript
const matchingStore = await magentoClient.findMatchingStore(domainToMatch);
storeIdToUse = Number(matchingStore.id);
```

Dit voorkomt dat orders van verkeerde stores worden geïmporteerd.

### Stap 4: Watermark Bepaling

Het systeem gebruikt een "watermark" (laatste verwerkte entity_id) om alleen nieuwe orders op te halen:

```typescript
let startEntityId = 0;
if (website.magentoLastEntityId) {
  startEntityId = website.magentoLastEntityId; // Start vanaf laatste sync
} else {
  startEntityId = 0; // Eerste sync: start vanaf begin
}
```

### Stap 5: Orders Ophalen via smartSync

```typescript
const syncResult = await magentoClient.smartSync(
  storeIdToUse,
  startEntityId,
  {
    lookAhead: maxOrders, // Max aantal orders om te checken
    pageSize: 10           // Aantal orders per API call
  }
);
```

De `smartSync` methode:
1. Probeert eerst "discovery" methode (efficiënter)
2. Valt terug op "ID-probing" als discovery faalt
3. Retourneert array van `MagentoOrder` objecten

### Stap 6: Orders Converteren naar Customers

Voor elke order wordt de `convertMagentoOrderToCustomer` functie aangeroepen:

```typescript
const customerData = convertMagentoOrderToCustomer(order, websiteId);
```

**Conversie logica** (`lib/magento-api.ts:2055-2090`):

1. **Naam bepaling:**
   - Eerst: `customer_firstname + customer_lastname` (als beschikbaar)
   - Anders: Extract naam uit email (voor @ teken)
   - Fallback: `"Unknown Customer"`

2. **Data mapping:**
   ```typescript
   {
     websiteId: websiteId,
     name: customerName,
     email: order.customer_email,
     productName: 'Unknown Product', // Default waarde
     purchaseDate: new Date(order.created_at),
     status: 'PENDING'
   }
   ```

### Stap 7: Duplicaat Check

Voor elke order wordt gecontroleerd of de consument al bestaat:

```typescript
const existingCustomer = await prisma.customer.findFirst({
  where: {
    websiteId: websiteId,
    email: customerData.email,
    purchaseDate: customerData.purchaseDate,
  }
});
```

**Belangrijk:** De check gebruikt zowel `email` als `purchaseDate` om te bepalen of het een duplicaat is. Dit betekent dat dezelfde email meerdere keren kan voorkomen als de `purchaseDate` verschilt.

### Stap 8: Opslaan in Database

Als de consument nog niet bestaat, wordt deze opgeslagen:

```typescript
if (!existingCustomer) {
  await prisma.customer.create({
    data: {
      ...customerData,
      email: customerData.email! // TypeScript: we weten dat email niet undefined is
    }
  });
  importedCustomers++;
}
```

**Let op:** Orders zonder email worden overgeslagen:
```typescript
if (!customerData.email) {
  console.log(`Skipping order ${order.entity_id} - no email`);
  continue;
}
```

### Stap 9: Watermark Update

Na verwerking van alle orders wordt de hoogste `entity_id` opgeslagen als watermark:

```typescript
let highestEntityId = startEntityId;
for (const order of orders) {
  if (order.entity_id > highestEntityId) {
    highestEntityId = order.entity_id;
  }
}

// Update website met nieuwe watermark
await prisma.website.update({
  where: { id: websiteId },
  data: {
    magentoLastEntityId: highestEntityId, // Voor volgende sync
    magentoAutoUploadStatus: 'STOPPED',
    magentoSyncStatus: 'completed',
    magentoLastSync: new Date(),
  }
});
```

## Belangrijke Details

### Duplicaat Preventie

Het systeem voorkomt duplicaten door te checken op:
- `websiteId` + `email` + `purchaseDate`

Dit betekent:
- ✅ Dezelfde email met verschillende aankoopdatums = verschillende consumenten
- ❌ Dezelfde email met dezelfde aankoopdatum = duplicaat (wordt overgeslagen)

### Error Handling

- Orders zonder email worden overgeslagen (geen error)
- Individuele order errors worden gelogd maar stoppen niet de hele sync
- Als sync faalt, wordt status gezet naar `ERROR`

### Status Tracking

De website heeft verschillende status velden:
- `magentoAutoUploadStatus`: `STOPPED` | `RUNNING` | `ERROR`
- `magentoSyncStatus`: Sync status (bijv. `completed`)
- `magentoLastSync`: Timestamp van laatste sync
- `magentoLastEntityId`: Watermark voor volgende sync

### Constraints en Validatie

1. **Database constraint:** `@@unique([websiteId, email])` - voorkomt duplicaten op database niveau
2. **Application check:** Check op `email + purchaseDate` voordat wordt opgeslagen
3. **Email validatie:** Orders zonder email worden overgeslagen

## Code Locaties

- **Sync endpoints:**
  - `app/api/magento/auto-sync/route.ts` - Handmatige sync
  - `app/api/cron/auto-sync/route.ts` - Automatische cron sync

- **Magento client:**
  - `lib/magento-api.ts` - MagentoApiClient class
  - `convertMagentoOrderToCustomer()` functie (regel 2055)

- **Database schema:**
  - `prisma/schema.prisma` - Customer model (regel 115-130)

- **Customer API:**
  - `app/api/customers/route.ts` - GET/POST endpoints voor customers

## Voorbeeld Flow

```
1. User triggert sync voor website "example.com"
2. Systeem haalt website op uit database
3. Magento client wordt geïnitialiseerd met API credentials
4. Store wordt gematcht op basis van domein
5. Watermark wordt opgehaald: entity_id 50000
6. smartSync haalt orders op vanaf entity_id 50000
7. 10 nieuwe orders gevonden (entity_id 50001-50010)
8. Voor elke order:
   - Order wordt geconverteerd naar customer data
   - Check of customer al bestaat (email + purchaseDate)
   - Als nieuw: opslaan in database
9. Watermark wordt geupdate naar 50010
10. Status wordt gezet naar STOPPED
11. Response: "10 nieuwe klanten geïmporteerd"
```

## Troubleshooting Tips

1. **Geen consumenten worden opgeslagen:**
   - Check of orders een email hebben
   - Check of consumenten al bestaan (duplicaat check)
   - Check Magento API connectie

2. **Duplicaten worden opgeslagen:**
   - Check of `purchaseDate` correct wordt gezet
   - Check database constraint werkt

3. **Sync stopt niet:**
   - Check timeout logica (30 minuten)
   - Check status updates in database

