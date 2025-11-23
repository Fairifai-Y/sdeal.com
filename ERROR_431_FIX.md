# Error 431 Fix: Request Header Fields Too Large

## Probleem

De error `431 (Request Header Fields Too Large)` betekent dat de HTTP headers te groot zijn. Dit kan gebeuren als:
- Te veel cookies
- Te grote headers in requests
- Server heeft te kleine `maxHeaderSize` limiet

## Oplossing

### 1. Lokale Server (Express)

De Express server is aangepast om grotere headers toe te staan:

```javascript
const http = require('http');
const server = http.createServer({
  maxHeaderSize: 32768 // 32KB (default is 8KB)
}, app);
```

**Herstart de server:**
```bash
cd server
npm run dev
```

### 2. Vercel (Production)

Vercel heeft standaard een limiet van 16KB voor headers. Als je nog steeds 431 errors krijgt op Vercel:

**Optie A: Verwijder grote cookies/headers**
- Check of er grote data in cookies wordt opgeslagen
- Gebruik localStorage/sessionStorage in plaats van cookies voor grote data

**Optie B: Vercel Configuration**
- Vercel heeft geen directe configuratie voor maxHeaderSize
- Maar je kunt `vercel.json` gebruiken om headers te optimaliseren

### 3. Check Headers

Om te zien welke headers te groot zijn, check de browser DevTools:
1. Open DevTools → Network tab
2. Klik op een failed request
3. Check "Request Headers" sectie
4. Zoek naar grote headers (cookies, authorization, etc.)

## Preventie

### Best Practices

1. **Gebruik localStorage/sessionStorage voor grote data**
   ```javascript
   // ❌ Slecht: grote data in cookie
   document.cookie = `largeData=${JSON.stringify(hugeObject)}`;
   
   // ✅ Goed: gebruik sessionStorage
   sessionStorage.setItem('largeData', JSON.stringify(hugeObject));
   ```

2. **Minimaliseer cookies**
   - Gebruik alleen essentiële data in cookies
   - Houd cookies klein (< 4KB per cookie)

3. **Clean up oude data**
   - Verwijder oude cookies regelmatig
   - Check localStorage/sessionStorage voor oude data

## Test

Na het herstarten van de server, test of de error weg is:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test sync endpoint
curl http://localhost:3000/api/admin/mailing/sync-customers
```

Als de error blijft, check:
1. Browser DevTools → Network → Request Headers
2. Server logs voor header size warnings
3. Cookies in browser (Application → Cookies)

