# Verschil Analyse: Werkend Project vs Onze Implementatie

## Belangrijkste Verschillen

### 1. **Simpliciteit vs Complexiteit**

#### Werkend Project (✅ Werkt)
```typescript
// Voor elke order, simpel en direct:
for (const order of orders) {
  // 1. Converteer order naar customer data
  const customerData = convertMagentoOrderToCustomer(order, websiteId);
  
  // 2. Check of bestaat (email + purchaseDate)
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      websiteId: websiteId,
      email: customerData.email,
      purchaseDate: customerData.purchaseDate,
    }
  });
  
  // 3. Als niet bestaat, create
  if (!existingCustomer) {
    await prisma.customer.create({ data: customerData });
  }
}
```

**Kenmerken:**
- ✅ **Geen semaphore** - gewoon sequentieel
- ✅ **Geen timeouts** - gewoon await
- ✅ **Geen retries** - gewoon try/catch
- ✅ **Geen delays** - direct door
- ✅ **Geen batches** - één voor één
- ✅ **Simpel en duidelijk**

#### Onze Implementatie (❌ Complex)
```javascript
// Semaphore, timeouts, retries, delays, batches...
await querySemaphore.acquire();
try {
  existingConsumer = await Promise.race([
    prisma.consumer.findFirst(...),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 15000)
    )
  ]);
  // Retries, exponential backoff, disconnect/reconnect...
} finally {
  querySemaphore.release();
  await new Promise(resolve => setTimeout(resolve, 300));
}
```

**Kenmerken:**
- ❌ **Semaphore** - max 2 concurrent
- ❌ **Timeouts** - 15 seconden per query
- ❌ **Retries** - 3 retries met exponential backoff
- ❌ **Delays** - 300ms na elke query, 2s tussen batches
- ❌ **Batches** - 10 customers per batch
- ❌ **Complex en moeilijk te debuggen**

### 2. **Duplicaat Check**

#### Werkend Project
```typescript
// Check op email + purchaseDate
const existingCustomer = await prisma.customer.findFirst({
  where: {
    websiteId: websiteId,
    email: customerData.email,
    purchaseDate: customerData.purchaseDate,  // ← Belangrijk!
  }
});
```

**Logica:**
- ✅ Dezelfde email met verschillende purchaseDate = verschillende customers
- ✅ Dezelfde email metzelfde purchaseDate = duplicaat (skip)

#### Onze Implementatie
```javascript
// Check alleen op email
const existingConsumer = await prisma.consumer.findFirst({
  where: { email: email }  // ← Alleen email!
});
```

**Logica:**
- ❌ Alleen email check
- ❌ Update bestaande consumer (niet skip)
- ❌ Geen purchaseDate check

### 3. **Watermark Systeem**

#### Werkend Project
```typescript
// Start vanaf laatste sync (watermark)
let startEntityId = 0;
if (website.magentoLastEntityId) {
  startEntityId = website.magentoLastEntityId; // Start vanaf laatste
}

// Sync alleen nieuwe orders
const syncResult = await magentoClient.smartSync(
  storeIdToUse,
  startEntityId,  // ← Start vanaf hier
  { lookAhead: maxOrders, pageSize: 10 }
);

// Update watermark na sync
await prisma.website.update({
  data: { magentoLastEntityId: highestEntityId }
});
```

**Voordelen:**
- ✅ Sync alleen nieuwe orders (efficiënt)
- ✅ Geen duplicaten
- ✅ Sneller (minder data)

#### Onze Implementatie
```javascript
// Haalt ALLE orders op (geen watermark)
let page = 1;
while (hasMore && page <= maxPagesLimit) {
  const ordersData = await makeMagentoRequest('/orders', {
    'searchCriteria[pageSize]': batchSize,
    'searchCriteria[currentPage]': page
  });
  // ...
}
```

**Nadelen:**
- ❌ Haalt alle orders op (inefficiënt)
- ❌ Verwerkt mogelijk duplicaten
- ❌ Langzamer (meer data)

### 4. **Page Size**

#### Werkend Project
```typescript
pageSize: 10  // ← Kleine batches
```

#### Onze Implementatie
```javascript
batchSize: 100  // ← Grote batches
```

**Impact:**
- Werkend: 10 orders per API call = minder data per keer
- Ons: 100 orders per API call = meer data, meer queries

### 5. **Error Handling**

#### Werkend Project
```typescript
// Simpel: skip order en ga door
if (!customerData.email) {
  console.log(`Skipping order ${order.entity_id} - no email`);
  continue;
}

try {
  await prisma.customer.create({ data: customerData });
} catch (error) {
  // Log error, maar stop niet
  console.error(`Error creating customer: ${error}`);
  // Continue met volgende order
}
```

#### Onze Implementatie
```javascript
// Complex: retries, timeouts, semaphore
let retries = 3;
while (retries > 0 && !success) {
  await querySemaphore.acquire();
  try {
    await Promise.race([...]);
  } catch (error) {
    // Exponential backoff, disconnect/reconnect...
  } finally {
    querySemaphore.release();
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
```

### 6. **Database Schema Verschil**

#### Werkend Project
```prisma
model Customer {
  websiteId        String
  email            String
  purchaseDate     DateTime?  // ← Belangrijk voor duplicaat check
  @@unique([websiteId, email])
}
```

#### Onze Implementatie
```prisma
model Consumer {
  email            String
  // Geen purchaseDate!
  @@unique([email])
}
```

## Waarom Werkt Het Werkende Project?

1. **Simpliciteit** - Geen over-engineering
2. **Sequentieel** - Één query tegelijk = geen connection pool issues
3. **Watermark** - Sync alleen nieuwe orders
4. **Kleine batches** - 10 orders per keer
5. **PurchaseDate check** - Betere duplicaat preventie
6. **Geen updates** - Alleen creates (als niet bestaat)

## Wat Moeten We Aanpassen?

### 1. Verwijder Complexiteit
- ❌ Verwijder semaphore
- ❌ Verwijder timeouts (of maak optioneel)
- ❌ Verwijder retries (of simpel houden)
- ❌ Verwijder delays (of minimaal)

### 2. Maak Het Simpel
```javascript
// Simpel zoals werkend project:
for (const customer of customers) {
  const existing = await prisma.consumer.findFirst({
    where: { email: customer.email }
  });
  
  if (!existing) {
    await prisma.consumer.create({ data: customerData });
  }
}
```

### 3. Voeg Watermark Toe
- Start vanaf laatste sync
- Sync alleen nieuwe orders

### 4. Kleine Batches
- 10-20 orders per API call (niet 100)

### 5. PurchaseDate Check (optioneel)
- Als Consumer model purchaseDate heeft, gebruik voor duplicaat check

## Conclusie

Het werkende project is **veel simpeler** en werkt daarom beter. Onze implementatie is **over-geoptimaliseerd** met te veel complexiteit die connection pool issues veroorzaakt.

**Simpliciteit = Betrouwbaarheid**

