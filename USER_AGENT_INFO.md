# User-Agent Header Informatie

## Huidige User-Agent

De huidige User-Agent header die wordt gebruikt:

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

Dit is een **browser-achtige User-Agent** (Chrome op Windows).

## Waar wordt het gebruikt?

De User-Agent wordt automatisch toegevoegd aan alle requests naar de Seller Admin API in:
- `api/seller-admin/helpers.js` - functie `getAuthHeaders()`

## Custom User-Agent instellen

Je kunt nu een custom User-Agent instellen via environment variabele:

### In Vercel:
1. Ga naar **Project → Settings → Environment Variables**
2. Voeg toe:
   - **Name:** `SELLER_ADMIN_USER_AGENT`
   - **Value:** (de User-Agent die je developer aanraadt)
3. **Save** en **Redeploy**

### Voorbeelden van User-Agent strings:

**Browser (huidig):**
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

**API Client:**
```
SDeal-API-Client/1.0
```

**cURL:**
```
curl/7.68.0
```

**Node.js fetch:**
```
node-fetch/2.6.1
```

**Custom (wat je developer aanraadt):**
```
(Vul hier in wat je developer aanraadt)
```

## Waarom is User-Agent belangrijk?

Cloudflare en andere security services gebruiken User-Agent om:
- Bots te detecteren
- Browser vs API requests te onderscheiden
- Rate limiting toe te passen
- Security policies te handhaven

Een specifieke User-Agent kan helpen om:
- ✅ Requests te identificeren als legitieme API calls
- ✅ Cloudflare bot detection te omzeilen
- ✅ Rate limiting te verbeteren
- ✅ Security policies te respecteren

## Test

Na het instellen van een custom User-Agent, test opnieuw:
```
GET /api/seller-admin/test?supplierId=1773
```

Check de logs om te zien welke User-Agent wordt gebruikt.

## Vraag aan Developer

**Wat is de aanbevolen User-Agent string?**

Mogelijke opties:
1. Een specifieke API client identifier (bijv. `SDeal-API-Client/1.0`)
2. Een specifieke browser User-Agent
3. Geen User-Agent (leeg)
4. Een custom string die de API verwacht

Zodra we weten wat de aanbevolen User-Agent is, kunnen we deze instellen via de environment variabele `SELLER_ADMIN_USER_AGENT`.

