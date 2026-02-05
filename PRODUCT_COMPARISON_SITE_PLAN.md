# Plan: Product Vergelijkingssite (1.5M Producten)

## Overzicht
Een snelle, simpele vergelijkingssite voor 1.5 miljoen producten uit Magento, met focus op performance en gebruiksvriendelijkheid.

---

## 1. Database Architectuur

### 1.1 Product Model (Prisma Schema)
**Kernvelden:**
- `id` (String, cuid)
- `sku` (String, unique) - Magento SKU als unieke identifier
- `entityId` (Int, unique) - Magento entity_id voor sync tracking
- `name` (String) - Productnaam
- `description` (String?) - Volledige beschrijving
- `shortDescription` (String?) - Korte beschrijving voor listings
- `price` (Float) - Prijs
- `specialPrice` (Float?) - Aanbiedingsprijs
- `status` (String) - enabled/disabled
- `isInStock` (Boolean) - Voorraad status
- `qty` (Int?) - Voorraad hoeveelheid
- `brand` (String?) - Merk
- `type` (String?) - Product type
- `imageUrl` (String?) - Hoofdafbeelding
- `thumbnailUrl` (String?) - Thumbnail
- `attributes` (Json?) - Product attributen voor vergelijking
- `storeId` (String?) - Store ID (NL, DE, BE, FR)
- `syncedAt` (DateTime?) - Laatste sync tijdstip
- `magentoData` (Json?) - Volledige Magento data (voor referentie)

**Indexes (voor performance):**
- `@@index([sku])`
- `@@index([status])`
- `@@index([isInStock])`
- `@@index([price])`
- `@@index([brand])`
- `@@index([storeId])`
- `@@index([type])`
- PostgreSQL full-text search op `name` en `description` (via raw SQL migration)

### 1.2 ProductSyncStatus Model
- Watermark systeem (zoals bij Consumer sync)
- Track `lastEntityId` voor incrementele syncs
- Status tracking (running, stopped, error)

---

## 2. Data Sync Strategie

### 2.1 Eerste Import (Full Sync)
**Aanpak:**
- Gebruik **NIET** het 5GB SQL bestand direct
- Sync via Magento REST API in batches
- Batch size: 500-1000 producten per request
- Parallel processing: 3-5 batches tegelijk (niet te veel om Magento niet te overbelasten)

**Stappen:**
1. Haal totaal aantal producten op via `/products?searchCriteria[pageSize]=1`
2. Verdeel in batches van 500 producten
3. Process batches parallel (max 5 tegelijk)
4. Sla op in database met `upsert` (update als SKU bestaat, anders create)
5. Update `ProductSyncStatus` met laatste `entityId`

**Tijd schatting:**
- 1.5M producten / 500 per batch = 3000 batches
- ~2-3 seconden per batch = 1.5-2.5 uur voor volledige sync
- Met parallel processing (5 batches): ~30-50 minuten

### 2.2 Incrementele Sync (Dagelijks)
**Aanpak:**
- Gebruik watermark systeem (laatste `entityId`)
- Sync alleen nieuwe/gewijzigde producten sinds laatste sync
- Cronjob: Elke 6 uur (zoals incremental-sync voor consumers)

**API Endpoint:** `/api/products/sync`
- GET: Status opvragen
- POST: Start sync (full of incremental)

---

## 3. API Endpoints

### 3.1 Product Search API
**Endpoint:** `/api/products/search`

**Query Parameters:**
- `q` (string) - Zoekterm (full-text search)
- `page` (int, default: 1) - Pagina nummer
- `limit` (int, default: 20, max: 100) - Resultaten per pagina
- `brand` (string) - Filter op merk
- `minPrice` (float) - Minimale prijs
- `maxPrice` (float) - Maximale prijs
- `inStock` (boolean) - Alleen op voorraad
- `storeId` (string) - Filter op store (NL, DE, BE, FR)
- `sortBy` (string) - Sorteer op: `price_asc`, `price_desc`, `name_asc`, `name_desc`, `relevance`
- `category` (string) - Filter op categorie

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1500000,
      "totalPages": 75000
    },
    "filters": {
      "brands": [...],
      "priceRange": { "min": 0, "max": 10000 }
    }
  }
}
```

**Performance:**
- Gebruik PostgreSQL full-text search voor `q` parameter
- Limit altijd resultaten (max 100 per request)
- Cache populaire queries (Redis optioneel)

### 3.2 Product Comparison API
**Endpoint:** `/api/products/compare`

**Body:**
```json
{
  "sku": ["SKU1", "SKU2", "SKU3"]
}
```

**Response:**
- Product details voor alle opgegeven SKUs
- Side-by-side vergelijking van attributen

### 3.3 Product Detail API
**Endpoint:** `/api/products/[sku]`

- Volledige product informatie
- Gerelateerde producten
- Reviews/ratings (indien beschikbaar)

---

## 4. Frontend Architectuur

### 4.1 Tech Stack
- **React** (huidige stack)
- **React Router** voor routing
- **CSS Framework:** W3.CSS (al aanwezig) of Tailwind CSS voor simpliciteit
- **State Management:** React Context API of Zustand (lichtgewicht)

### 4.2 Pagina's

#### 4.2.1 Homepage
- Zoekbalk (prominent)
- Populaire categorieën
- Top deals/aanbiedingen
- Recent toegevoegde producten

#### 4.2.2 Zoekresultaten Pagina
**Features:**
- Zoekbalk bovenaan
- Filter sidebar:
  - Prijs range slider
  - Merk checkboxes
  - Categorie dropdown
  - Op voorraad checkbox
- Product grid (20 per pagina)
- Paginatie (oneindig scroll OF traditionele paginatie)
- Sorteer dropdown

**Product Card:**
- Thumbnail
- Naam
- Prijs (met specialPrice indien aanwezig)
- Merk
- "Vergelijk" button
- "Bekijk details" link

#### 4.2.3 Vergelijkingspagina
**Features:**
- Side-by-side tabel met producten
- Kolommen: Naam, Prijs, Merk, Attributen, etc.
- "Verwijder" button per product
- "Voeg product toe" zoekbalk
- Max 5-10 producten tegelijk vergelijken

#### 4.2.4 Product Detail Pagina
- Volledige product informatie
- Alle afbeeldingen
- Alle attributen
- "Voeg toe aan vergelijking" button
- Link naar Magento product pagina (indien nodig)

### 4.3 Performance Optimalisaties
- **Lazy loading** voor product images
- **Virtual scrolling** voor grote lijsten (react-window)
- **Debounced search** (wacht 300ms na laatste keystroke)
- **Pagination** in plaats van alle resultaten laden
- **Image optimization:** Gebruik CDN/optimized images
- **Caching:** Service Worker voor offline support (optioneel)

---

## 5. Sync Implementatie

### 5.1 API Endpoint: `/api/products/sync`
**Functionaliteit:**
- Full sync: Alle producten ophalen en syncen
- Incremental sync: Alleen nieuwe/gewijzigde producten
- Status tracking via `ProductSyncStatus` model

**Batch Processing:**
- Haal 500 producten per batch op
- Process in chunks om timeouts te voorkomen
- Retry logic voor failed requests
- Progress tracking

### 5.2 Cronjob
**Toevoegen aan `vercel.json`:**
```json
{
  "path": "/api/products/sync",
  "schedule": "0 */6 * * *"
}
```

**Of handmatig triggeren via:**
- POST `/api/products/sync?type=incremental`

---

## 6. Database Optimalisaties

### 6.1 Indexes
- Alle filter/sort velden geïndexeerd
- Composite indexes voor veelgebruikte queries (bijv. `[status, isInStock, price]`)
- Full-text search index op `name` en `description`

### 6.2 Partitioning (Optioneel, voor later)
- Bij >10M producten: Partitioneren op `storeId` of `createdAt`

### 6.3 Caching Strategie
- **Redis** (optioneel) voor:
  - Populaire zoekopdrachten
  - Filter opties (brands, categories)
  - Product details (veel bekeken producten)
- **TTL:** 1-24 uur afhankelijk van data

---

## 7. Deployment & Infrastructuur

### 7.1 Database
- **PostgreSQL** (Neon) - huidige setup
- **Connection pooling** - al geïmplementeerd
- **Backup strategie:** Dagelijkse backups

### 7.2 Hosting
- **Vercel** - huidige setup
- **Serverless functions** voor API endpoints
- **Static assets** via Vercel CDN

### 7.3 Monitoring
- Sync status monitoring
- API response times
- Database query performance
- Error tracking

---

## 8. Implementatie Fasen

### Fase 1: Basis Setup (Week 1)
1. ✅ Database schema toevoegen (Product + ProductSyncStatus)
2. ✅ Migration uitvoeren
3. ✅ Test sync met kleine dataset (1000 producten)

### Fase 2: Sync Systeem (Week 1-2)
1. ✅ Magento products API endpoint maken
2. ✅ Full sync implementeren
3. ✅ Incremental sync implementeren
4. ✅ Error handling & retry logic
5. ✅ Test met volledige dataset

### Fase 3: Search API (Week 2)
1. ✅ Search endpoint met filters
2. ✅ Full-text search implementeren
3. ✅ Pagination & sorting
4. ✅ Performance testing

### Fase 4: Frontend (Week 3)
1. ✅ Zoekresultaten pagina
2. ✅ Product detail pagina
3. ✅ Vergelijkingspagina
4. ✅ Filtering & sorting UI

### Fase 5: Optimalisatie (Week 4)
1. ✅ Performance tuning
2. ✅ Caching implementeren
3. ✅ Image optimization
4. ✅ SEO optimalisatie

---

## 9. Risico's & Overwegingen

### 9.1 Data Volume
- **1.5M producten** = grote database
- **Storage:** ~50-100GB geschat (afhankelijk van descriptions/images)
- **Query performance:** Indexes zijn cruciaal
- **Sync tijd:** Eerste sync duurt lang, daarna alleen incrementeel

### 9.2 Magento API Limits
- Rate limiting respecteren
- Batch sizes aanpassen indien nodig
- Retry logic voor timeouts

### 9.3 Performance
- Full-text search kan traag zijn op grote datasets
- Overweeg **Elasticsearch** of **Algolia** voor betere search (later)
- Pagination is essentieel

### 9.4 Kosten
- Database storage kosten (Neon)
- Vercel serverless function costs (bij veel traffic)
- CDN costs voor images

---

## 10. Alternatieven & Toekomstige Uitbreidingen

### 10.1 Search Engine
- **Elasticsearch** voor geavanceerde search
- **Algolia** voor instant search (SaaS oplossing)
- **PostgreSQL full-text search** (start simpel)

### 10.2 Caching Layer
- **Redis** voor hot data
- **Vercel Edge Cache** voor static content
- **CDN** voor images

### 10.3 Features (Later)
- User accounts & favorieten
- Price alerts
- Product reviews
- Recommendations engine
- Analytics dashboard

---

## 11. Success Criteria

- ✅ Sync van 1.5M producten binnen 1-2 uur
- ✅ Search response time < 500ms
- ✅ Pagina laadtijd < 2 seconden
- ✅ 99.9% uptime
- ✅ Incremental sync binnen 10-15 minuten

---

## 12. Documentatie

- API documentatie (Swagger/OpenAPI)
- Sync status dashboard
- Error logging & monitoring
- User guide voor vergelijkingssite

---

**Volgende Stap:** Start met Fase 1 - Database schema en eerste test sync.
