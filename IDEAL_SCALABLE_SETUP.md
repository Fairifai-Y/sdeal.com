# Ideale Schalbare Setup - Product Vergelijkingssite

## Overzicht
Dit document beschrijft de **ideale setup** voor een product vergelijkingssite die schaalbaar is van 1.5M naar 10M+ producten, met focus op performance, kosten en onderhoudbaarheid.

---

## 1. Database Architectuur (PostgreSQL)

### 1.1 Database Keuze: Neon PostgreSQL (Huidige Setup)
**Waarom Neon:**
- ✅ Serverless PostgreSQL (automatisch scaling)
- ✅ Connection pooling ingebouwd
- ✅ Auto-pause voor kostenbesparing
- ✅ Branching voor staging/test environments
- ✅ Betaalbare pricing (pay-as-you-go)

**Upgrade Path:**
- **Starter:** Tot ~5M producten (gratis/laag)
- **Scale:** 5-20M producten (betaald plan)
- **Enterprise:** 20M+ producten (custom setup)

### 1.2 Database Schema Optimalisaties

#### Product Model Structuur
```prisma
model Product {
  id          String  @id @default(cuid())
  sku         String  @unique
  entityId    Int?    @unique
  
  // Core fields (always indexed)
  name        String
  price       Float
  status      String  @default("enabled")
  isInStock   Boolean @default(true)
  brand       String?
  storeId     String?
  
  // Large fields (separate or JSON)
  description String? // Consider TEXT type for very long descriptions
  attributes  Json?   // Flexible attributes
  
  // Media (store URLs, not base64)
  imageUrl    String?
  thumbnailUrl String?
  
  // Search optimization
  searchVector tsvector? // PostgreSQL full-text search vector
  
  // Sync tracking
  syncedAt    DateTime?
  updatedAt   DateTime @updatedAt
  
  // Composite indexes for common queries
  @@index([status, isInStock, price])
  @@index([storeId, status, price])
  @@index([brand, status])
  @@index([syncedAt])
  
  // Full-text search (PostgreSQL specific)
  // Requires raw SQL migration
}
```

#### Database Partitioning (Bij >10M producten)
**Partitioneren op `storeId` of `createdAt`:**
- Verdeelt data over meerdere tabellen
- Snellere queries (minder data te scannen)
- Eenvoudiger maintenance per partition

**Implementatie:**
```sql
-- Partition by storeId (NL, DE, BE, FR)
CREATE TABLE products_nl PARTITION OF products 
  FOR VALUES IN ('NL');
CREATE TABLE products_de PARTITION OF products 
  FOR VALUES IN ('DE');
-- etc.
```

### 1.3 Index Strategie

**Essentiële Indexes:**
1. **Primary Key:** `id` (automatisch)
2. **Unique:** `sku`, `entityId`
3. **Single Column:** `status`, `isInStock`, `price`, `brand`, `storeId`
4. **Composite:** `[status, isInStock, price]`, `[storeId, status]`
5. **Full-Text:** `name`, `description` (PostgreSQL tsvector)

**Index Maintenance:**
- PostgreSQL auto-updates indexes
- Monitor index size (kan groot worden)
- Overweeg **partial indexes** voor veelgebruikte filters:
  ```sql
  CREATE INDEX idx_active_products ON products(price) 
    WHERE status = 'enabled' AND isInStock = true;
  ```

---

## 2. Search Engine Architectuur

### 2.1 Fase 1: PostgreSQL Full-Text Search (Start)
**Voor:** 1.5M - 5M producten

**Voordelen:**
- ✅ Geen extra service nodig
- ✅ Geïntegreerd in PostgreSQL
- ✅ Goede performance tot ~5M records
- ✅ Geen extra kosten

**Implementatie:**
```sql
-- Create full-text search index
CREATE INDEX products_search_idx ON products 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Search query
SELECT * FROM products 
WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) 
  @@ plainto_tsquery('english', 'search term')
ORDER BY ts_rank(...) DESC
LIMIT 20;
```

**Limitaties:**
- Langzamer bij >5M producten
- Minder geavanceerde features (fuzzy search, typo tolerance)
- Complexere queries kunnen traag zijn

### 2.2 Fase 2: Elasticsearch (5M+ producten)
**Voor:** 5M - 50M+ producten

**Waarom Elasticsearch:**
- ✅ Geoptimaliseerd voor search
- ✅ Fuzzy search & typo tolerance
- ✅ Faceted search (filters)
- ✅ Real-time updates
- ✅ Horizontal scaling

**Setup Opties:**

#### Optie A: Elastic Cloud (SaaS)
- **Kosten:** ~$95-200/maand (afhankelijk van data)
- **Voordelen:** Managed, geen server management
- **Nadelen:** Maandelijkse kosten

#### Optie B: Self-Hosted (AWS/GCP)
- **Kosten:** ~$50-150/maand (EC2 instances)
- **Voordelen:** Meer controle, lagere kosten bij scale
- **Nadelen:** Server management nodig

**Architectuur:**
```
Magento → Sync API → PostgreSQL (source of truth)
                      ↓
                   Elasticsearch (search index)
                      ↓
                   Search API → Frontend
```

**Sync Strategie:**
- Sync naar PostgreSQL eerst
- Daarna sync naar Elasticsearch (async)
- Elasticsearch = read-only search index
- PostgreSQL = source of truth

### 2.3 Fase 3: Algolia (Alternatief - Premium)
**Voor:** Premium search experience

**Voordelen:**
- ✅ Instant search (typing = results)
- ✅ Typo tolerance out-of-the-box
- ✅ Analytics ingebouwd
- ✅ Managed service

**Nadelen:**
- ❌ Duurder ($99+/maand)
- ❌ Vendor lock-in
- ❌ Minder controle

**Wanneer gebruiken:**
- Budget is geen probleem
- Premium UX is prioriteit
- Geen tijd voor self-hosting

---

## 3. Caching Strategie

### 3.1 Multi-Layer Caching

#### Layer 1: Application Cache (Redis)
**Voor:** Hot data, populaire queries

**Wat cachen:**
- Populaire zoekopdrachten (TTL: 1-6 uur)
- Filter opties (brands, categories) - TTL: 24 uur
- Product details (veel bekeken) - TTL: 1 uur
- Comparison data - TTL: 30 minuten

**Redis Setup:**
- **Upstash Redis** (Serverless, Vercel integratie)
  - Kosten: ~$10-50/maand
  - Geen server management
  - Auto-scaling
- **Redis Cloud** (Alternatief)
  - Kosten: ~$10-100/maand
  - Meer features

**Implementatie:**
```javascript
// Cache popular searches
const cacheKey = `search:${query}:${filters}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... fetch from database ...
await redis.setex(cacheKey, 3600, JSON.stringify(results));
```

#### Layer 2: CDN Cache (Vercel Edge)
**Voor:** Static content, API responses

**Wat cachen:**
- Product images (via CDN)
- API responses (GET requests)
- Static assets

**Vercel Edge Cache:**
- Automatisch voor static files
- Configureerbaar voor API routes
- Global distribution

#### Layer 3: Browser Cache
**Voor:** Client-side caching

**Implementatie:**
- Service Worker voor offline support
- LocalStorage voor comparison data
- HTTP cache headers voor images

### 3.2 Cache Invalidation Strategie

**Strategie:**
1. **Time-based (TTL):** Automatisch expire na X tijd
2. **Event-based:** Invalideer bij product updates
3. **Tag-based:** Invalideer gerelateerde caches

**Voorbeeld:**
```javascript
// When product is updated
await redis.del(`product:${sku}`);
await redis.del(`search:*`); // Invalidate all searches (or use tags)
```

---

## 4. Image & Media Handling

### 4.1 Image Storage Strategie

#### Optie A: Magento CDN (Huidige Setup)
**Voor:** Start simpel

**Voordelen:**
- ✅ Geen extra kosten
- ✅ Images al beschikbaar
- ✅ Geen migratie nodig

**Nadelen:**
- ❌ Afhankelijk van Magento uptime
- ❌ Geen image optimization
- ❌ Langzamer bij scale

#### Optie B: Cloudinary / ImageKit (Aanbevolen)
**Voor:** Production-ready setup

**Voordelen:**
- ✅ Automatische image optimization
- ✅ On-the-fly resizing
- ✅ WebP/AVIF conversion
- ✅ CDN distribution
- ✅ Lazy loading support

**Kosten:**
- **Cloudinary:** ~$89-299/maand (25GB-100GB)
- **ImageKit:** ~$49-199/maand (20GB-100GB)

**Implementatie:**
```javascript
// Transform images on-the-fly
const thumbnailUrl = `https://res.cloudinary.com/xxx/image/fetch/w_300,h_300,c_fill/${product.imageUrl}`;
```

#### Optie C: AWS S3 + CloudFront
**Voor:** Volledige controle

**Voordelen:**
- ✅ Zeer schaalbaar
- ✅ Betaalbaar bij grote volumes
- ✅ Volledige controle

**Nadelen:**
- ❌ Meer setup werk
- ❌ Image optimization zelf implementeren

### 4.2 Image Optimization Best Practices

**Formaten:**
- **WebP** voor moderne browsers
- **AVIF** voor beste compressie (toekomst)
- **JPEG/PNG** als fallback

**Sizes:**
- Thumbnail: 300x300px
- Listing: 600x600px
- Detail: 1200x1200px
- Original: behoud voor zoom

**Lazy Loading:**
- Load images alleen wanneer zichtbaar
- Placeholder tijdens loading
- Progressive loading (blur-up)

---

## 5. API & Backend Architectuur

### 5.1 API Endpoints Structuur

```
/api/products/
  ├── search          # Search with filters
  ├── compare         # Compare products
  ├── [sku]          # Product detail
  ├── sync           # Sync from Magento
  └── filters        # Get available filters (brands, etc.)
```

### 5.2 Performance Optimalisaties

#### Database Queries
- **Select only needed fields:** `select: { id, name, price }`
- **Use pagination:** Always limit results
- **Avoid N+1 queries:** Use `include` voor relations
- **Use indexes:** Alle filter/sort velden geïndexeerd

#### Response Optimization
- **Compress responses:** Gzip/Brotli
- **Minimize JSON size:** Remove null/undefined fields
- **Stream large responses:** Voor exports

#### Rate Limiting
- **Per IP:** Max 100 requests/minuut
- **Per API key:** Voor authenticated requests
- **Per endpoint:** Verschillende limits per endpoint

### 5.3 Background Jobs

**Voor:** Sync, data processing

**Opties:**

#### Optie A: Vercel Cron Jobs (Huidige Setup)
- ✅ Geen extra service
- ✅ Gratis (met Vercel plan)
- ❌ Limiet: Max 1x per minuut
- ❌ Geen queue management

#### Optie B: Inngest (Aanbevolen)
- ✅ Serverless job queue
- ✅ Retry logic ingebouwd
- ✅ Monitoring dashboard
- ✅ Kosten: ~$20-100/maand

#### Optie C: BullMQ + Redis
- ✅ Volledige controle
- ✅ Geavanceerde features
- ❌ Meer setup werk
- ❌ Server management

---

## 6. Frontend Architectuur

### 6.1 Tech Stack

**Core:**
- **React** (huidige setup)
- **React Router** voor routing
- **Zustand** voor state management (lichtgewicht)

**UI:**
- **Tailwind CSS** (aanbevolen) of **W3.CSS** (huidige)
- **Headless UI** voor accessible components
- **React Query** voor data fetching & caching

**Performance:**
- **React.lazy** voor code splitting
- **react-window** voor virtual scrolling
- **Intersection Observer** voor lazy loading

### 6.2 Performance Optimalisaties

#### Code Splitting
```javascript
// Route-based splitting
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const ComparePage = React.lazy(() => import('./pages/ComparePage'));
```

#### Virtual Scrolling
- Voor grote resultaten lijsten
- Render alleen zichtbare items
- Library: `react-window` of `react-virtual`

#### Image Optimization
- Lazy loading met Intersection Observer
- Responsive images (srcset)
- WebP format met fallback

#### Caching
- React Query voor API caching
- Service Worker voor offline support
- LocalStorage voor user preferences

### 6.3 SEO Optimalisaties

**Server-Side Rendering (SSR):**
- Overweeg **Next.js** (later) voor SSR
- Of **Remix** voor betere data loading
- Huidige setup: Client-side (kan later migreren)

**SEO Best Practices:**
- Meta tags per pagina
- Structured data (JSON-LD)
- Sitemap generatie
- Robots.txt

---

## 7. Monitoring & Observability

### 7.1 Application Monitoring

#### Optie A: Vercel Analytics (Basis)
- ✅ Gratis met Vercel
- ✅ Basic metrics
- ❌ Beperkte features

#### Optie B: Sentry (Aanbevolen)
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ User feedback
- ✅ Kosten: ~$26-80/maand

#### Optie C: Datadog / New Relic (Enterprise)
- ✅ Volledige observability
- ✅ APM, logs, metrics
- ❌ Duur (~$100-500/maand)

### 7.2 Database Monitoring

**Neon Dashboard:**
- Query performance
- Connection pool usage
- Storage usage

**Custom Monitoring:**
- Slow query logging
- Index usage stats
- Cache hit rates

### 7.3 Key Metrics

**Performance:**
- API response time (p95 < 500ms)
- Database query time (p95 < 200ms)
- Cache hit rate (>80%)
- Page load time (<2s)

**Business:**
- Search queries per day
- Products compared
- Popular searches
- Conversion rate (indien tracking)

---

## 8. Scaling Roadmap

### Fase 1: 1.5M - 5M Producten (Start)
**Setup:**
- PostgreSQL (Neon) met full-text search
- Redis caching (Upstash)
- Vercel hosting
- Magento images (of Cloudinary)

**Kosten:** ~$50-150/maand

### Fase 2: 5M - 10M Producten
**Upgrades:**
- Migreer naar Elasticsearch
- Upgrade Neon database plan
- Image CDN (Cloudinary)
- Background jobs (Inngest)

**Kosten:** ~$200-500/maand

### Fase 3: 10M+ Producten
**Upgrades:**
- Database partitioning
- Elasticsearch cluster
- Dedicated Redis instance
- Advanced monitoring

**Kosten:** ~$500-2000/maand

---

## 9. Kosten Overzicht

### Maandelijkse Kosten Schatting

#### Fase 1 (1.5M-5M producten)
- **Neon PostgreSQL:** $0-50 (free tier of scale)
- **Vercel:** $20 (Pro plan)
- **Upstash Redis:** $10-25
- **Cloudinary:** $0-89 (free tier of plus)
- **Totaal:** ~$30-164/maand

#### Fase 2 (5M-10M producten)
- **Neon PostgreSQL:** $50-150
- **Vercel:** $20
- **Upstash Redis:** $25-50
- **Elastic Cloud:** $95-200
- **Cloudinary:** $89-199
- **Sentry:** $26-80
- **Totaal:** ~$305-700/maand

#### Fase 3 (10M+ producten)
- **Neon PostgreSQL:** $150-500
- **Vercel:** $20-100
- **Redis:** $50-200
- **Elasticsearch:** $200-500
- **Cloudinary:** $199-499
- **Monitoring:** $80-200
- **Totaal:** ~$700-2000/maand

---

## 10. Aanbevolen Start Setup

### Minimum Viable Setup (MVP)
1. ✅ PostgreSQL (Neon) - huidige setup
2. ✅ PostgreSQL full-text search
3. ✅ Vercel hosting - huidige setup
4. ✅ Basic caching (in-memory of Redis)
5. ✅ Magento images (later migreren naar CDN)

**Kosten:** ~$20-50/maand

### Production-Ready Setup (Aanbevolen)
1. ✅ PostgreSQL (Neon Scale plan)
2. ✅ Upstash Redis voor caching
3. ✅ Cloudinary voor images
4. ✅ Sentry voor error tracking
5. ✅ Inngest voor background jobs

**Kosten:** ~$150-300/maand

### Enterprise Setup (10M+ producten)
1. ✅ PostgreSQL (Neon Enterprise) + partitioning
2. ✅ Elasticsearch cluster
3. ✅ Dedicated Redis
4. ✅ Cloudinary Enterprise
5. ✅ Full monitoring stack

**Kosten:** ~$700-2000/maand

---

## 11. Migration Strategie

### Van PostgreSQL Full-Text naar Elasticsearch

**Stappen:**
1. Setup Elasticsearch cluster
2. Sync alle producten naar Elasticsearch (parallel met PostgreSQL)
3. Update Search API om Elasticsearch te gebruiken
4. Monitor performance
5. PostgreSQL blijft source of truth
6. Elasticsearch = read-only search index

**Downtime:** Geen (parallel run)

---

## 12. Best Practices

### Database
- ✅ Altijd pagination gebruiken
- ✅ Select alleen nodig velden
- ✅ Gebruik indexes voor alle filters
- ✅ Monitor slow queries
- ✅ Regular VACUUM/ANALYZE

### API
- ✅ Rate limiting implementeren
- ✅ Response compression
- ✅ Caching waar mogelijk
- ✅ Error handling & retry logic
- ✅ API versioning

### Frontend
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Virtual scrolling voor grote lijsten
- ✅ Debounced search
- ✅ Optimistic UI updates

---

## 13. Conclusie

**Ideale Setup voor Schaalbaarheid:**

1. **Start Simpel:** PostgreSQL + full-text search (tot 5M)
2. **Scale Up:** Voeg Elasticsearch toe (5M+)
3. **Optimize:** Caching, CDN, monitoring
4. **Enterprise:** Partitioning, clusters, advanced monitoring

**Belangrijkste Principes:**
- Start simpel, scale wanneer nodig
- Monitor performance continu
- Cache agressief waar mogelijk
- Gebruik managed services waar mogelijk
- Plan voor groei, maar over-engineering niet

**Volgende Stap:** Start met MVP setup, monitor performance, en scale wanneer nodig.
