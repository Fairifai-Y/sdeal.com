# Cloudflare Block Oplossing

## Probleem

De Seller Admin API geeft een **403 Forbidden** error, maar dit komt niet van de API zelf, maar van **Cloudflare's bot protection**. Cloudflare blokkeert de requests omdat ze komen van Vercel's serverless functions.

## Error Details

De error response bevat een Cloudflare HTML pagina met de boodschap:
- "Sorry, you have been blocked"
- "You are unable to access sportdeal.nl"
- Cloudflare Ray ID wordt getoond

## Oplossingen

### Oplossing 1: Whitelist Vercel IP Addresses (Aanbevolen)

De API administrator moet Vercel's IP addresses whitelisten in Cloudflare:

1. **Vercel IP Ranges:**
   - Vercel gebruikt AWS IP ranges
   - Bekijk Vercel's IP ranges: https://vercel.com/docs/security/ip-addresses
   - Of gebruik Vercel's API om de actuele IPs op te halen

2. **In Cloudflare Dashboard:**
   - Ga naar Security → WAF
   - Maak een nieuwe rule om Vercel IPs toe te staan
   - Of gebruik IP Access Rules om Vercel IPs te whitelisten

### Oplossing 2: Cloudflare Bot Protection Aanpassen

1. **Ga naar Security → Bots**
2. **Pas de bot protection aan:**
   - Zet "Super Bot Fight Mode" uit voor API endpoints
   - Of maak een exception voor `/rest/V1/*` endpoints
   - Pas "Bot Fight Mode" aan om API requests toe te staan

### Oplossing 3: API Gateway / Proxy

Als whitelisting niet mogelijk is, overweeg:
- Een proxy server tussen Vercel en de API
- Een API gateway die wel toegang heeft
- Een dedicated server die de requests doorstuurt

### Oplossing 4: Cloudflare API Token

Als de API een Cloudflare API token ondersteunt, gebruik die in plaats van directe requests.

## Wat is al gedaan

✅ **User-Agent header toegevoegd** - Requests lijken nu meer op browser requests
✅ **Browser headers toegevoegd** - Accept-Language, Accept-Encoding, etc.
✅ **Cloudflare block detection** - Errors worden nu correct geïdentificeerd
✅ **Betere error messages** - Duidelijke uitleg over het probleem

## Testen

Na het deployen van de nieuwe code, test opnieuw:

```bash
GET /api/seller-admin/test?supplierId=1773
```

Als Cloudflare nog steeds blokkeert, moet de API administrator de bovenstaande stappen uitvoeren.

## Contact

Neem contact op met de API administrator (sportdeal.nl) om:
1. Vercel IP addresses te whitelisten
2. Cloudflare bot protection aan te passen voor API endpoints
3. Of een alternatieve toegangsmethode te bespreken

## Alternatieve Benadering

Als whitelisting niet mogelijk is, overweeg:
- Een cron job op een server die wel toegang heeft
- Een webhook die periodiek data ophaalt
- Een directe database connectie (als toegestaan)
- Een API key die specifiek voor serverless functions is bedoeld

