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

#### Stap 1: Vercel IP Ranges Ophalen

**⚠️ BELANGRIJK: Vercel gebruikt dynamische IPs!**

Het IP dat je hebt gewhitelist (`216.150.1.1`) is **niet** het IP dat Vercel gebruikt. In de error response zie je dat het geblokkeerde IP `34.205.20.126` is.

**Vercel serverless functions gebruiken verschillende IPs per request!** Je moet daarom **IP ranges** whitelisten, niet individuele IPs.

1. **Vercel IP Ranges:**
   - Vercel gebruikt AWS IP ranges
   - Bekijk Vercel's officiële IP ranges: https://vercel.com/docs/security/ip-addresses
   - Of gebruik Vercel's API: `curl https://api.vercel.com/v1/edge-config/ip-ranges`
   - Vercel IP ranges worden regelmatig bijgewerkt, dus check deze regelmatig

2. **Voor het IP dat nu geblokkeerd wordt (`34.205.20.126`):**
   - Dit is een AWS IP in de `34.x.x.x` range
   - Je moet de volledige Vercel IP ranges whitelisten, niet alleen dit ene IP
   - Vercel kan verschillende IPs gebruiken voor verschillende requests

3. **Hoe Vercel IP Ranges te krijgen:**
   ```bash
   # Via Vercel API
   curl https://api.vercel.com/v1/edge-config/ip-ranges
   
   # Of bekijk de documentatie
   # https://vercel.com/docs/security/ip-addresses
   ```

#### Stap 2: Whitelisten in Cloudflare Dashboard

**Optie A: Via IP Access Rules (Aanbevolen - Eenvoudigst)**

1. **Login in Cloudflare Dashboard:**
   - Ga naar https://dash.cloudflare.com
   - Selecteer je domain (sportdeal.nl)

2. **Navigeer naar Security → WAF:**
   - Klik op "Security" in de linker sidebar
   - Klik op "WAF" (Web Application Firewall)

3. **Ga naar IP Access Rules:**
   - Scroll naar beneden naar "Tools"
   - Klik op "IP Access Rules" of "Tools" → "IP Access Rules"

4. **Maak een nieuwe Allow Rule:**
   - Klik op "Create rule" of "Add rule"
   - **Action:** Selecteer "Allow"
   - **IP Address or IP Range:** 
     - Voer Vercel IP ranges in (bijv. `76.76.21.0/24`)
     - Of voer individuele IPs in gescheiden door komma's
     - Voor meerdere ranges, maak meerdere rules of gebruik CIDR notation
   - **Note (optioneel):** "Vercel Serverless Functions"
   - Klik op "Save"

**Optie B: Via WAF Custom Rules (Meer Geavanceerd)**

1. **Ga naar Security → WAF:**
   - Klik op "Security" → "WAF"

2. **Klik op "Custom rules":**
   - Scroll naar "Custom rules" sectie
   - Klik op "Create rule"

3. **Configureer de Rule:**
   - **Rule name:** "Allow Vercel IPs"
   - **When incoming requests match:**
     - Field: `IP Source Address`
     - Operator: `is in`
     - Value: Voer Vercel IP ranges in (bijv. `76.76.21.0/24`)
   - **Then:** Selecteer "Allow"
   - **Priority:** Laag nummer (bijv. 1) zodat deze rule eerst wordt geëvalueerd
   - Klik op "Deploy"

**Optie C: Via Firewall Rules (Alternatief)**

1. **Ga naar Security → WAF:**
   - Klik op "Security" → "WAF"

2. **Klik op "Firewall rules":**
   - Scroll naar "Firewall rules"
   - Klik op "Create rule"

3. **Configureer de Rule:**
   - **Rule name:** "Allow Vercel Serverless Functions"
   - **Field:** `IP Source Address`
   - **Operator:** `is in`
   - **Value:** Voer Vercel IP ranges in
   - **Action:** "Allow"
   - Klik op "Save"

#### Stap 3: Verifieer de Whitelist

1. Test of de whitelist werkt:
   - Maak een test request vanuit Vercel
   - Check de Cloudflare logs om te zien of de request wordt toegestaan
   - Ga naar Security → Events om requests te monitoren

#### Belangrijke Notities:

- **Vercel IP Ranges Veranderen:**
  - Vercel IP ranges kunnen veranderen
  - Check regelmatig https://vercel.com/docs/security/ip-addresses
  - Overweeg een automatisch update proces

- **CIDR Notation:**
  - Gebruik CIDR notation voor IP ranges (bijv. `76.76.21.0/24`)
  - Dit is efficiënter dan individuele IPs

- **Prioriteit:**
  - Allow rules moeten een hogere prioriteit hebben dan block rules
  - Zet Allow rules bovenaan in de lijst

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

