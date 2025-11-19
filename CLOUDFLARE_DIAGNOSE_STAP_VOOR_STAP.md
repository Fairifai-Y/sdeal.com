# Cloudflare Diagnose - Stap voor Stap

## ✅ Wat We Weten

1. ✅ IP Whitelist is actief: `34.205.0.0/16` met status "Active"
2. ✅ Bot Protection is NIET actief (0/2 running)
3. ❌ Requests worden nog steeds geblokkeerd

## 🔍 Diagnose: Waar Komt de Blokkade Vandaan?

### Stap 1: Check Security Events (BELANGRIJKSTE!)

Dit toont je **exact** welke rule de request blokkeert:

1. **Ga naar Security → Events** (of Security → WAF → Events)
2. **Filter instellen:**
   - Tijd: Laatste 5-10 minuten
   - Status: Blocked / Challenge
3. **Maak een test request:**
   - Roep `/api/seller-admin/test?supplierId=1773` aan
4. **Check de Events log:**
   - Zoek naar de geblokkeerde request
   - Kijk in de kolom **"Action taken"** - dit toont welke rule blokkeert
   - Kijk in de kolom **"Rule name"** - dit toont de naam van de rule
   - Kijk in de kolom **"Reason"** - dit toont waarom het geblokkeerd wordt

**Dit is de beste manier om te zien wat er precies gebeurt!**

### Stap 2: Check WAF Custom Rules

1. **Ga naar Security → WAF → Custom rules**
2. **Check alle actieve rules:**
   - Zijn er rules die `/rest/V1/*` of `/supplier/*` blokkeren?
   - Zijn er rules die alle API requests blokkeren?
   - Zijn er rules met hoge prioriteit die Allow rules overschrijven?

3. **Als je een blokkerende rule vindt:**
   - Pas deze aan om `/rest/V1/*` toe te staan
   - Of maak een Allow exception voor deze path

### Stap 3: Check Firewall Rules

1. **Ga naar Security → WAF → Firewall rules**
2. **Check alle actieve rules:**
   - Zijn er rules die Vercel IPs of API paths blokkeren?
   - Check de prioriteit van rules

3. **Zorg dat je Allow rule hoge prioriteit heeft:**
   - Allow rules moeten een **laag nummer** hebben (bijv. 1, 2, 3)
   - Block rules moeten een **hoog nummer** hebben

### Stap 4: Check API Abuse Settings

Je dashboard toont: **"API abuse: Detection tools: 1/1 running"**

1. **Ga naar Security → WAF → API abuse** (of Security → API abuse)
2. **Check de settings:**
   - Zijn er endpoints geconfigureerd die worden beschermd?
   - Is er schema validation actief die requests blokkeert?
   - Zijn er rate limits die requests blokkeren?

3. **Als API abuse actief is:**
   - Voeg `/rest/V1/*` toe als toegestane endpoints
   - Of zet API abuse uit voor deze paths

### Stap 5: Check IP Access Rules Prioriteit

1. **Ga naar Security → WAF → IP Access Rules**
2. **Check de "Order" kolom:**
   - Je Allow rule moet een **laag nummer** hebben (bijv. 1)
   - Als er andere rules zijn met lagere nummers, verplaats je Allow rule naar boven
   - Of verhoog de prioriteit

3. **Check of er andere rules zijn die blokkeren:**
   - Zijn er Block rules met lagere nummers?
   - Zijn er Challenge rules die requests blokkeren?

### Stap 6: Test met Bredere IP Range

Als niets werkt, test met een bredere range:

1. **Voeg tijdelijk toe:**
   - IP Range: `34.0.0.0/8` (hele AWS 34.x.x.x range)
   - Action: Allow
   - Priority: 1 (hoogste)

2. **Test opnieuw:**
   - Als dit werkt, weet je dat het IP range probleem is
   - Vercel gebruikt mogelijk andere ranges dan alleen 34.205.x.x

## 🎯 Meest Waarschijnlijke Oorzaken (in volgorde)

### 1. WAF Custom Rule blokkeert API paths
- **Check:** Security → WAF → Custom rules
- **Oplossing:** Maak Allow exception voor `/rest/V1/*`

### 2. Firewall Rule heeft hogere prioriteit
- **Check:** Security → WAF → Firewall rules
- **Oplossing:** Verhoog prioriteit van Allow rule

### 3. API Abuse protection blokkeert requests
- **Check:** Security → API abuse
- **Oplossing:** Voeg `/rest/V1/*` toe als toegestane endpoint

### 4. IP Range is te smal
- **Check:** Vercel gebruikt mogelijk andere IP ranges
- **Oplossing:** Whitelist alle Vercel IP ranges

### 5. Rate Limiting blokkeert requests
- **Check:** Security → WAF → Rate limiting rules
- **Oplossing:** Maak exception voor API paths

## 📊 Test Endpoints

Test deze endpoints om te zien welke werken:

```bash
# Test alle endpoints
GET /api/seller-admin/test-endpoints?supplierId=1773&orderId=68074

# Test alleen balance
GET /api/seller-admin/test?supplierId=1773

# Test orders
GET /api/seller-admin/orders?supplierId=1773&page=1&pageSize=5
```

## 🔧 Snelle Fixes

### Fix 1: Maak Allow Exception voor API Paths

1. **Security → WAF → Custom rules**
2. **Create rule:**
   - Name: "Allow API requests"
   - When: `URI Path` `starts with` `/rest/V1/`
   - Then: `Allow`
   - Priority: 1

### Fix 2: Check Rate Limiting

1. **Security → WAF → Rate limiting rules**
2. Check of er rate limits zijn die requests blokkeren
3. Maak exception voor `/rest/V1/*`

### Fix 3: Bredere IP Range (Tijdelijk)

1. **Security → WAF → IP Access Rules**
2. Voeg toe: `34.0.0.0/8` met Allow action
3. Test of dit werkt

## 📝 Checklist

- [ ] Security Events gecheckt - welke rule blokkeert?
- [ ] WAF Custom Rules gecheckt - zijn er blokkerende rules?
- [ ] Firewall Rules gecheckt - prioriteit correct?
- [ ] API Abuse settings gecheckt - endpoints geconfigureerd?
- [ ] IP Access Rules prioriteit gecheckt - Allow rule bovenaan?
- [ ] Rate Limiting gecheckt - zijn er limits actief?
- [ ] Test met bredere IP range - werkt dit?

## 💡 Belangrijkste Tip

**Check Security → Events!** Dit toont je precies welke rule de request blokkeert en waarom. Dit is de snelste manier om het probleem te vinden.

