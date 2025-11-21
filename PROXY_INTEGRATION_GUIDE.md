# Magento API Proxy Integratie Guide

## Overzicht

Deze guide beschrijft hoe je een Magento API client aanpast om via een proxy te werken, om Cloudflare blokkades te omzeilen. Deze integratie is essentieel voor automatische Magento order synchronisatie via cron jobs.

## Magento Sync Workflow

### Wat doet de Magento Sync?

De Magento sync synchroniseert automatisch orders van je Magento webshop naar je applicatie:

1. **Discovery**: Vindt nieuwe orders sinds de laatste sync (via watermark/entity_id)
2. **Filtering**: Filtert orders op basis van store_id (om alleen relevante orders te importeren)
3. **Hydration**: Haalt volledige order details op
4. **Conversion**: Converteert Magento orders naar customer records
5. **Storage**: Slaat customers op in de database voor review requests

### Waarom is de Proxy nodig?

- **Cloudflare Protection**: Magento servers zijn vaak beschermd door Cloudflare
- **Cron Job Blokkades**: Automatische cron jobs worden geblokkeerd door Cloudflare bot detection
- **Rate Limiting**: Directe requests kunnen rate limited worden
- **IP Restrictions**: Vercel/serverless IPs kunnen geblokkeerd zijn

De proxy omzeilt deze problemen door:
- Requests te routeren via een vertrouwde server
- Cloudflare bot detection te omzeilen
- Consistente IP adressen te gebruiken

## Probleem

- Magento API calls worden geblokkeerd door Cloudflare
- Directe API calls falen met 403/429 errors
- Cron jobs kunnen niet verbinden met Magento

## Oplossing

Alle Magento API requests routeren via een externe proxy server die:
- De requests doorstuurt naar Magento
- Cloudflare blokkades omzeilt
- Gzipped responses doorgeeft

---

## Stap 1: Proxy Server Setup

### Proxy Requirements

De proxy server moet:
- PHP ondersteunen (of een andere taal)
- cURL ondersteunen
- SSL verificatie kunnen uitvoeren

### Proxy PHP Code

```php
<?php
// === CONFIG ===
$PROXY_SECRET = 'supergeheimesleutel123'; // Zelfde als in Vercel/Environment

header('Content-Type: application/json; charset=utf-8');

// Polyfill voor getallheaders als nodig
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$key] = $value;
            }
        }
        return $headers;
    }
}

// 1) Secret check
$headers = getallheaders();
$incomingSecret = $headers['X-Proxy-Secret'] ?? $headers['x-proxy-secret'] ?? null;

if ($incomingSecret !== $PROXY_SECRET) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized (bad proxy secret)']);
    exit;
}

// 2) Target URL uit query parameter
$targetUrl = isset($_GET['url']) ? $_GET['url'] : '';

if (!$targetUrl) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing url parameter']);
    exit;
}

// (optioneel) Extra beveiliging: alleen specifieke URLs toestaan
// if (strpos($targetUrl, 'https://www.sdeal.nl/rest/V1') !== 0) {
//     http_response_code(400);
//     echo json_encode(['error' => 'Invalid target URL']);
//     exit;
// }

$method = $_SERVER['REQUEST_METHOD'];

// 3) Body ophalen
$body = file_get_contents('php://input');

// 4) cURL-setup
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Alleen body bij methodes waar het logisch is
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// 5) Headers doorsturen (behalve Host & X-Proxy-Secret)
$forwardHeaders = [];
foreach ($headers as $key => $value) {
    $lower = strtolower($key);
    if ($lower === 'host') continue;
    if ($lower === 'x-proxy-secret') continue;
    $forwardHeaders[] = $key . ': ' . $value;
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

// SSL aan laten
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

// 6) Request uitvoeren
$responseBody = curl_exec($ch);
if ($responseBody === false) {
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    
    http_response_code(502);
    echo json_encode([
        'error'   => 'Proxy error',
        'message' => $error,
        'code'    => $errno,
        'target'  => $targetUrl,
    ]);
    exit;
}

$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'application/json; charset=utf-8';

curl_close($ch);

// 7) Response teruggeven (direct doorgeven, inclusief gzip encoding)
http_response_code($httpCode);
header('Content-Type: ' . $contentType);
// Belangrijk: Content-Encoding header doorgeven als die bestaat
if (isset($headers['Content-Encoding'])) {
    header('Content-Encoding: ' . $headers['Content-Encoding']);
}
echo $responseBody;
```

### Proxy URL Format

De proxy verwacht requests in dit format:
- **URL**: `https://your-proxy.com/proxy?url=ENCODED_TARGET_URL`
- **Method**: HTTP method (GET, POST, etc.)
- **Header**: `X-Proxy-Secret: your-secret-key`
- **Body**: (alleen voor POST/PUT/PATCH/DELETE)

---

## Stap 2: Environment Variables

Voeg deze environment variables toe aan je project (Vercel/andere hosting):

```
PROXY_BASE_URL=https://caityapps.com/proxy
PROXY_SECRET=supergeheimesleutel123
```

**Belangrijk**: 
- `PROXY_BASE_URL` moet de volledige URL zijn naar je proxy endpoint
- `PROXY_SECRET` moet exact hetzelfde zijn als in de proxy PHP code

---

## Stap 3: Magento API Client Structuur

### 3.0 Magento API Client Overzicht

Een typische Magento API client heeft deze structuur:

```typescript
export class MagentoApiClient {
  private config: MagentoConfig;
  private accessToken: string | null = null;
  
  // Core methods
  async makeRequest(method: string, endpoint: string): Promise<any>
  async testConnection(): Promise<boolean>
  async getOrders(...): Promise<MagentoOrder[]>
  
  // Sync methods
  async smartSync(storeId: number, watermark: number): Promise<SyncResult>
  async discoverStoreLight(...): Promise<DiscoveryResult>
  async probeStore(...): Promise<ProbeResult>
}
```

**Belangrijk**: Alle methods die HTTP requests maken moeten via de proxy gaan!

## Stap 4: Code Wijzigingen

### 4.1 Import zlib voor gzip decompressie

Voeg bovenaan je Magento API client file toe:

```typescript
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);
```

### 4.2 Proxy Request Helper Methode

Voeg deze methode toe aan je Magento API client class:

```typescript
// ===== Proxy helper =====
private async makeProxyRequest(
  targetUrl: string, 
  method: string, 
  headers: Record<string, string> = {}, 
  body?: string
): Promise<Response> {
  let proxyBaseUrl = process.env.PROXY_BASE_URL || 'https://caityapps.com/proxy';
  const proxySecret = process.env.PROXY_SECRET || 'supergeheimesleutel123';
  
  // Ensure proxy URL has proper protocol and no trailing slash
  if (!proxyBaseUrl.startsWith('http://') && !proxyBaseUrl.startsWith('https://')) {
    proxyBaseUrl = `https://${proxyBaseUrl}`;
  }
  const proxyUrl = proxyBaseUrl.replace(/\/$/, '');
  
  console.log(`[proxy] Routing ${method} ${targetUrl} through ${proxyUrl}`);
  
  // Proxy expects:
  // 1. Secret in header: X-Proxy-Secret
  // 2. URL as query parameter: ?url=...
  // 3. Method via HTTP method (GET, POST, etc.)
  // 4. Body in request body (for POST, PUT, PATCH, DELETE)
  // 5. Headers in request headers (except Host and X-Proxy-Secret)
  
  const proxyUrlWithParams = `${proxyUrl}?url=${encodeURIComponent(targetUrl)}`;
  
  // Build headers to forward (exclude Host and X-Proxy-Secret)
  const forwardHeaders: Record<string, string> = {
    'X-Proxy-Secret': proxySecret,
  };
  
  // Add original headers (excluding Host)
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host') {
      forwardHeaders[key] = value;
    }
  }
  
  // Make request with appropriate method
  const requestOptions: RequestInit = {
    method: method,
    headers: forwardHeaders,
  };
  
  // Only add body for methods that support it
  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    requestOptions.body = body;
  }
  
  return fetch(proxyUrlWithParams, requestOptions);
}
```

### 4.3 Response Decompression Helper

Voeg deze helper methode toe:

```typescript
// ===== Response decompression helper =====
private async decompressResponse(response: Response): Promise<string> {
  const contentEncoding = response.headers.get('content-encoding') || '';
  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);
  
  // Decompress if gzipped
  if (contentEncoding.includes('gzip')) {
    try {
      buffer = await gunzipAsync(buffer);
      console.log('[http] Decompressed gzipped response');
    } catch (e) {
      console.warn('[http] Failed to decompress gzip, trying as-is:', e);
    }
  }
  
  // Convert to text with UTF-8 encoding
  const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
  let text = decoder.decode(buffer);
  
  // Remove BOM and other control characters at the start
  text = text.replace(/^[\uFEFF\u200B-\u200D\u2060]+/, '').trim();
  
  // Remove any null bytes or other problematic characters
  text = text.replace(/\0/g, '');
  
  return text;
}
```

### 4.4 Update makeRequest Method

Vervang je bestaande `makeRequest` method:

```typescript
public async makeRequest(method: string, endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await this.getAccessToken();
  
  // Normalize base
  const base = this.config.apiUrl.replace(/\/$/, '');
  
  // Normalize endpoint
  const ep = endpoint.replace(/^\/+/, '');
  const alreadyVersioned = /^([^\/]+\/)?V1\//.test(ep);
  const url = `${base}/rest/${alreadyVersioned ? ep : `V1/${ep}`}`;
  
  console.log(`[http] ${method} ${url}`);

  // Build headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Get body if present
  let bodyString: string | undefined;
  if (options.body) {
    if (typeof options.body === 'string') {
      bodyString = options.body;
    } else {
      bodyString = JSON.stringify(options.body);
    }
  }

  const res = await this.makeProxyRequest(url, method, headers, bodyString);

  // Decompress response using helper
  const contentType = res.headers.get('content-type') || '';
  const text = await this.decompressResponse(res);

  if (!res.ok) {
    let msg = text;
    try { 
      const parsed = JSON.parse(text);
      msg = parsed.message || parsed.error || text; 
    } catch {}
    console.error(`[http] Error ${res.status} ${res.statusText} – ${msg}`);
    console.error(`[http] URL: ${url}`);
    throw new Error(`Magento API request failed: ${res.status} ${res.statusText} - ${msg}`);
  }

  // Some endpoints return an empty body (204) — handle gracefully
  if (res.status === 204 || !text || text.trim() === '') {
    return null;
  }
  
  // Try to parse as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`[http] Failed to parse response as JSON:`, e);
    console.error(`[http] Response text (first 200 chars):`, text.substring(0, 200));
    throw new Error(`Failed to parse Magento API response as JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
}
```

### 4.5 Update getAccessToken Method

Als je admin token authenticatie gebruikt, update deze method:

```typescript
private async getAccessToken(): Promise<string> {
  if (this.config.bearerToken) {
    console.log('[auth] Using Bearer token');
    return this.config.bearerToken;
  }

  if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
    return this.accessToken;
  }

  if (this.config.apiKey && this.config.apiSecret) {
    const authUrl = `${this.config.apiUrl.replace(/\/$/, '')}/rest/V1/integration/admin/token`;
    const res = await this.makeProxyRequest(
      authUrl,
      'POST',
      { 'Content-Type': 'application/json' },
      JSON.stringify({ username: this.config.apiKey, password: this.config.apiSecret })
    );
    if (!res.ok) {
      const text = await this.decompressResponse(res);
      throw new Error(`Admin auth failed: ${res.status} ${res.statusText} - ${text}`);
    }
    const raw = await this.decompressResponse(res);
    // Remove BOM and quotes, trim whitespace
    const cleaned = raw.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim();
    this.accessToken = cleaned;
    this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    console.log('[auth] Admin token obtained');
    return this.accessToken;
  }

  throw new Error('No auth method provided (bearerToken or apiKey/apiSecret).');
}
```

### 4.6 Update ALL Direct fetch() Calls

**KRITIEK VOOR MAGENTO SYNC**: 

De Magento sync gebruikt verschillende discovery en probe methods die allemaal direct `fetch()` aanroepen. Deze moeten ALLEMAAL worden vervangen:

- `discoverStoreLight()` - Vindt orders via sales pivot
- `trySalesPivotAsc()` - Discovery method
- `tryDateSlicing()` - Fallback discovery
- `tryBasicApproach()` - Fallback discovery
- `trySalesPivot()` - Alternative discovery
- `hydrateOrdersConcurrently()` - Haalt order details op
- `probeSalesPivotAsc()` - Probe method voor orders
- `probeGlobalRouteMinimal()` - Probe fallback
- `probeDateSlicing()` - Probe fallback
- `probeBasicApproach()` - Probe fallback
- `getCustomerEmailByOrderId()` - Haalt customer email op

**Zoek naar alle plaatsen waar je direct `fetch()` gebruikt:**

**BELANGRIJK**: Vervang ALLE directe `fetch()` calls naar Magento API met `makeProxyRequest()`.

Zoek naar alle plaatsen waar je direct `fetch()` gebruikt:

```typescript
// ❌ OUD - Direct fetch
const response = await fetch(url.toString(), {
  headers: {
    'Authorization': `Bearer ${this.config.bearerToken}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// ✅ NIEUW - Via proxy
const response = await this.makeProxyRequest(
  url.toString(),
  'GET',
  {
    'Authorization': `Bearer ${this.config.bearerToken}`,
    'Content-Type': 'application/json'
  }
);
const text = await this.decompressResponse(response);
const data = JSON.parse(text);
```

**Zoek naar alle plaatsen met:**
- `await fetch(.*magento|.*apiUrl)`
- `response.json()`
- Directe URL calls naar je Magento API

**Vervang ze allemaal!**

---

## Stap 5: Magento Sync Specifieke Aanpassingen

### 5.1 Discovery Methods

Discovery methods vinden nieuwe orders. Vervang alle `fetch()` calls:

```typescript
// ❌ OUD - Direct fetch in discovery
const response = await fetch(url.toString(), {
  headers: {
    'Authorization': `Bearer ${this.config.bearerToken}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// ✅ NIEUW - Via proxy
const response = await this.makeProxyRequest(
  url.toString(),
  'GET',
  {
    'Authorization': `Bearer ${this.config.bearerToken}`,
    'Content-Type': 'application/json'
  }
);
const text = await this.decompressResponse(response);
const data = JSON.parse(text);
```

### 5.2 Probe Methods

Probe methods scannen order IDs. Ook hier alle `fetch()` vervangen.

### 5.3 Hydration Methods

Hydration methods halen volledige order details op. Belangrijk voor sync!

### 5.4 Customer Methods

Methods die customer data ophalen moeten ook via proxy.

## Stap 6: Testing

### 6.1 Test Connection

```typescript
const client = new MagentoApiClient({
  apiUrl: 'https://www.sdeal.nl',
  bearerToken: 'your-token'
});

const isConnected = await client.testConnection();
console.log('Connection:', isConnected ? 'OK' : 'FAILED');
```

### 6.2 Test Magento Sync

Test de volledige sync workflow:

```typescript
const client = new MagentoApiClient({
  apiUrl: 'https://www.sdeal.nl',
  bearerToken: 'your-token',
  storeId: 14 // Optioneel: specifieke store
});

// Test sync met watermark
const result = await client.smartSync(14, 94621, {
  lookAhead: 100,
  pageSize: 10
});

console.log(`Found ${result.orders.length} orders`);
console.log(`New watermark: ${result.newWatermark}`);
```

### 6.3 Check Logs

Je zou moeten zien:
```
[proxy] Routing GET https://www.sdeal.nl/rest/V1/store/websites through https://caityapps.com/proxy
[http] Decompressed gzipped response
[test] Connection OK
```

### 6.4 Common Issues

**Error: "Missing url parameter"**
- Check: Is de URL correct als query parameter gezet? `?url=ENCODED_URL`
- Check: Gebruik je `makeProxyRequest()` in plaats van direct `fetch()`?

**Error: "401 Unauthorized"**
- Check: Is `PROXY_SECRET` correct in environment variables?
- Check: Wordt `X-Proxy-Secret` header meegestuurd?

**Error: "Unexpected token" of parsing errors**
- Check: Wordt `decompressResponse()` gebruikt voor alle responses?
- Check: Is gzip decompressie correct geïmplementeerd?

**Error: "Failed to decompress gzip"**
- Check: Is `zlib` geïmporteerd?
- Check: Werkt de proxy correct (geeft het gzipped responses door)?

---

## Stap 7: Magento Sync Checklist

Specifiek voor Magento sync, controleer ook:

- [ ] `smartSync()` gebruikt proxy voor alle requests
- [ ] `discoverStoreLight()` gebruikt proxy
- [ ] Alle probe methods gebruiken proxy
- [ ] `hydrateOrdersConcurrently()` gebruikt proxy
- [ ] Store matching werkt (via proxy)
- [ ] Watermark wordt correct bijgewerkt
- [ ] Orders worden correct gefilterd op store_id
- [ ] Customer conversion werkt na sync

## Stap 8: Algemene Checklist

- [ ] Proxy server is geconfigureerd en werkt
- [ ] Environment variables zijn ingesteld (`PROXY_BASE_URL`, `PROXY_SECRET`)
- [ ] `zlib` imports zijn toegevoegd
- [ ] `makeProxyRequest()` methode is toegevoegd
- [ ] `decompressResponse()` methode is toegevoegd
- [ ] `makeRequest()` gebruikt nu `makeProxyRequest()`
- [ ] `getAccessToken()` gebruikt nu `makeProxyRequest()`
- [ ] **ALLE** directe `fetch()` calls zijn vervangen
- [ ] **ALLE** `response.json()` calls zijn vervangen door `decompressResponse()` + `JSON.parse()`
- [ ] Test connection werkt
- [ ] Logs tonen "[proxy] Routing" en "[http] Decompressed gzipped response"

---

## Magento Sync Specifieke Notities

### Watermark System

De sync gebruikt een "watermark" (laatste entity_id) om alleen nieuwe orders te vinden:

```typescript
// Start vanaf laatste sync
const watermark = 94621; // Laatste geïmporteerde order ID

// Sync vindt alleen orders met entity_id > watermark
const result = await client.smartSync(storeId, watermark);
// result.newWatermark = hoogste entity_id van geïmporteerde orders
```

### Store Filtering

Orders worden gefilterd op `store_id` om alleen relevante orders te importeren:

```typescript
// Alleen orders van store 14 (SportDeal NL)
const result = await client.smartSync(14, watermark);
```

### Incremental Sync

De sync is incremental - alleen nieuwe orders sinds laatste sync:

1. Haal watermark op uit database
2. Sync orders met entity_id > watermark
3. Sla nieuwe watermark op voor volgende sync

## Belangrijke Notities

1. **Response kan maar 1x gelezen worden**: Lees altijd eerst de response als text/decompress, dan parse als JSON
2. **Gzip is verplicht**: De proxy geeft gzipped responses door, decompressie is altijd nodig
3. **Secret moet exact overeenkomen**: Zowel in proxy als in environment variables
4. **URL encoding**: Zorg dat de target URL correct wordt ge-encode in de query parameter
5. **Headers forwarding**: Host en X-Proxy-Secret worden automatisch gefilterd

---

## Voorbeeld: Complete Magento Sync Flow

### Basis Request Flow

```typescript
// 1. Client maakt request
const client = new MagentoApiClient({ apiUrl: 'https://magento.com', bearerToken: 'token' });

// 2. Intern wordt makeProxyRequest() aangeroepen
//    → URL: https://proxy.com/proxy?url=https%3A%2F%2Fmagento.com%2Frest%2FV1%2Forders
//    → Header: X-Proxy-Secret: secret123
//    → Method: GET

// 3. Proxy ontvangt request
//    → Valideert secret
//    → Haalt target URL uit query parameter
//    → Forward request naar Magento
//    → Geeft response door (gzipped)

// 4. Client ontvangt response
//    → Decompresseert gzip
//    → Parse als JSON
//    → Retourneert data
```

### Volledige Sync Flow

```typescript
// 1. Start sync voor store 14, vanaf watermark 94621
const result = await client.smartSync(14, 94621);

// 2. Intern gebeurt:
//    a. Discovery: Vindt orders via proxy
//       → makeProxyRequest('GET', '/rest/V1/orders?...')
//       → Proxy forward naar Magento
//       → Gzipped response terug
//       → Decompress + parse
//       → Filter op store_id = 14
//
//    b. Probe (als discovery faalt): Scan order IDs
//       → makeProxyRequest('GET', '/rest/V1/orders?...')
//       → Zelfde proxy flow
//
//    c. Hydration: Haal volledige order details
//       → makeProxyRequest('GET', '/rest/V1/orders?...')
//       → Batch requests via proxy
//
// 3. Resultaat:
//    → orders: Array van MagentoOrder objecten
//    → newWatermark: Hoogste entity_id (bijv. 94703)
//    → totalProcessed: Aantal orders verwerkt
//    → successful: Aantal succesvol geïmporteerd

// 4. Sla nieuwe watermark op voor volgende sync
await db.update({ magentoLastEntityId: result.newWatermark });
```

### Cron Job Flow

```typescript
// Cron job (elke 6 uur)
export async function GET(request: NextRequest) {
  // 1. Haal websites op met auto-upload enabled
  const websites = await db.findMany({ magentoAutoUploadEnabled: true });
  
  for (const website of websites) {
    // 2. Maak client met proxy support
    const client = new MagentoApiClient({
      apiUrl: website.magentoApiUrl,
      bearerToken: website.magentoBearerToken,
      storeId: website.magentoStoreId
    });
    
    // 3. Sync vanaf laatste watermark
    const watermark = website.magentoLastEntityId || 0;
    const result = await client.smartSync(website.magentoStoreId, watermark);
    
    // 4. Importeer orders als customers
    for (const order of result.orders) {
      await db.customer.create({
        email: order.customer_email,
        websiteId: website.id,
        // ...
      });
    }
    
    // 5. Update watermark
    await db.website.update({
      magentoLastEntityId: result.newWatermark
    });
  }
}
```

---

## Troubleshooting

### Proxy geeft 400 "Missing url parameter"
- Check: Wordt `?url=...` query parameter gebruikt?
- Check: Is de URL correct ge-encode?

### Proxy geeft 401 "Unauthorized"
- Check: Is `X-Proxy-Secret` header aanwezig?
- Check: Komt secret overeen met proxy configuratie?

### Response parsing faalt
- Check: Wordt `decompressResponse()` gebruikt?
- Check: Is gzip decompressie correct?
- Check: Zijn er encoding problemen?

### Alleen sommige requests werken
- Check: Zijn ALLE `fetch()` calls vervangen?
- Check: Worden discovery/probe methods ook via proxy gedaan?

---

## Conclusie

Na deze stappen zouden alle Magento API calls via de proxy moeten gaan en zouden Cloudflare blokkades omzeild moeten worden. De belangrijkste punten zijn:

1. **Alle requests via proxy** - geen directe fetch() calls meer
2. **Gzip decompressie** - altijd decompressen voordat je parse
3. **Correcte headers** - X-Proxy-Secret moet aanwezig zijn
4. **URL encoding** - target URL moet correct ge-encode zijn

