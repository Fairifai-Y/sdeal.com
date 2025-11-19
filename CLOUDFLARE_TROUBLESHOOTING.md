# Cloudflare Whitelist Troubleshooting

## ✅ Whitelist Rule is Actief

Je hebt de whitelist rule correct aangemaakt:
- **IP Range:** `34.205.0.0/16`
- **Action:** Allow
- **Status:** Active ✅
- **Applies to:** All websites in account

## Maar Requests Worden Nog Steeds Geblokkeerd?

Als de rule actief is maar requests nog steeds worden geblokkeerd, check het volgende:

### 1. Check Rule Prioriteit

**Probleem:** Andere rules kunnen de Allow rule overschrijven.

**Oplossing:**
1. Ga naar **Security → WAF → IP Access Rules**
2. Check de **"Order"** kolom - je Allow rule moet een **laag nummer** hebben (bijv. 1)
3. Als er andere rules zijn met lagere nummers die blokkeren, verplaats je Allow rule naar boven
4. Of verhoog de prioriteit van je Allow rule

### 2. Check Bot Protection

**Probleem:** Bot Protection kan requests blokkeren VOORDAT IP Access Rules worden geëvalueerd.

**Oplossing:**
1. Ga naar **Security → Bots**
2. Check of **"Super Bot Fight Mode"** of **"Bot Fight Mode"** aan staat
3. Maak een **Exception** voor:
   - **Path:** `/rest/V1/*`
   - **Action:** Allow
4. Of zet Bot Protection uit voor API endpoints

### 3. Check WAF Custom Rules

**Probleem:** WAF Custom Rules kunnen Allow rules overschrijven.

**Oplossing:**
1. Ga naar **Security → WAF → Custom rules**
2. Check of er rules zijn die `/rest/V1/*` of API paths blokkeren
3. Pas deze rules aan of maak een Allow exception

### 4. Check Firewall Rules

**Probleem:** Firewall Rules hebben hogere prioriteit dan IP Access Rules.

**Oplossing:**
1. Ga naar **Security → WAF → Firewall rules**
2. Check of er rules zijn die Vercel IPs blokkeren
3. Maak een Allow rule met hoge prioriteit

### 5. Vercel IP Range is Te Smal

**Probleem:** `34.205.0.0/16` dekt alleen 34.205.x.x IPs, maar Vercel kan andere ranges gebruiken.

**Oplossing:**
1. Haal de volledige Vercel IP ranges op: https://vercel.com/docs/security/ip-addresses
2. Whitelist alle ranges, niet alleen `34.205.0.0/16`
3. Voor nu, test met een bredere range: `34.0.0.0/8` (tijdelijk, voor test)

### 6. Check Cloudflare Events Log

**Dit is de beste manier om te zien wat er gebeurt:**

1. Ga naar **Security → Events**
2. Maak een test request vanuit Vercel
3. Check de Events log voor die request
4. Kijk welke rule de request blokkeert
5. Check de "Action taken" kolom

Dit toont je **exact** welke rule de request blokkeert!

## Snelle Diagnose Stappen

### Stap 1: Test met Bredere IP Range (Tijdelijk)

Voeg deze rule toe voor test:
- **IP Range:** `34.0.0.0/8` (hele AWS 34.x.x.x range)
- **Action:** Allow
- **Priority:** 1 (hoogste prioriteit)

Test opnieuw. Als dit werkt, weet je dat het IP range probleem is.

### Stap 2: Check Security Events

1. **Security → Events**
2. Filter op laatste 5 minuten
3. Maak een test request
4. Kijk welke rule de request blokkeert

### Stap 3: Bot Protection Exception

1. **Security → Bots**
2. Maak exception voor path: `/rest/V1/*`
3. Test opnieuw

## Meest Waarschijnlijke Oorzaken

1. **Bot Protection blokkeert VOORDAT IP Access Rules worden geëvalueerd**
   - Oplossing: Maak Bot Protection exception voor `/rest/V1/*`

2. **Andere WAF/Firewall rules hebben hogere prioriteit**
   - Oplossing: Check Events log om te zien welke rule blokkeert

3. **IP Range is te smal**
   - Oplossing: Whitelist alle Vercel IP ranges

## Test Endpoint

Test deze endpoint om te zien welke endpoints werken:
```
GET /api/seller-admin/test-endpoints?supplierId=1773&orderId=68074
```

Dit toont je of:
- Alle endpoints worden geblokkeerd (IP/Bot Protection probleem)
- Alleen specifieke endpoints worden geblokkeerd (path-based blocking)

