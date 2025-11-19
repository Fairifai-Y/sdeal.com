# Cloudflare Whitelist Guide - Stap voor Stap

## Waar vind je Whitelist Opties in Cloudflare?

### Methode 1: IP Access Rules (Aanbevolen - Meest Eenvoudig)

**Locatie in Dashboard:**
```
Cloudflare Dashboard → Security → WAF → Tools → IP Access Rules
```

**Stappen:**
1. Login op https://dash.cloudflare.com
2. Selecteer je domain (sportdeal.nl)
3. Klik op **"Security"** in de linker sidebar
4. Klik op **"WAF"** (Web Application Firewall)
5. Scroll naar beneden naar **"Tools"** sectie
6. Klik op **"IP Access Rules"**
7. Klik op **"Create rule"** of **"Add rule"**
8. Vul in:
   - **Action:** `Allow`
   - **IP Address or IP Range:** Voer Vercel IP ranges in
   - **Note:** "Vercel Serverless Functions" (optioneel)
9. Klik op **"Save"**

---

### Methode 2: WAF Custom Rules

**Locatie in Dashboard:**
```
Cloudflare Dashboard → Security → WAF → Custom rules
```

**Stappen:**
1. Ga naar **Security → WAF**
2. Klik op **"Custom rules"** tab
3. Klik op **"Create rule"**
4. Configureer:
   - **Rule name:** "Allow Vercel IPs"
   - **When:** `IP Source Address` `is in` [Vercel IP ranges]
   - **Then:** `Allow`
   - **Priority:** 1 (laag nummer = hoge prioriteit)
5. Klik op **"Deploy"**

---

### Methode 3: Firewall Rules

**Locatie in Dashboard:**
```
Cloudflare Dashboard → Security → WAF → Firewall rules
```

**Stappen:**
1. Ga naar **Security → WAF**
2. Klik op **"Firewall rules"** tab
3. Klik op **"Create rule"**
4. Configureer de rule zoals hierboven beschreven
5. Klik op **"Save"**

---

## Vercel IP Ranges Ophalen

### Optie 1: Via Vercel Documentatie
- Ga naar: https://vercel.com/docs/security/ip-addresses
- Kopieer de IP ranges

### Optie 2: Via Vercel API
```bash
curl https://api.vercel.com/v1/edge-config/ip-ranges
```

### Optie 3: Via Vercel CLI
```bash
vercel ip-ranges
```

**Voorbeeld Vercel IP Ranges (kan veranderen!):**
```
76.76.21.0/24
76.76.22.0/24
76.76.23.0/24
```

---

## Stap-voor-Stap Screenshot Beschrijving

### Stap 1: Login en Selecteer Domain
1. Ga naar https://dash.cloudflare.com
2. Login met je Cloudflare account
3. Selecteer **"sportdeal.nl"** uit de domain lijst

### Stap 2: Navigeer naar Security
1. In de linker sidebar, klik op **"Security"**
2. Je ziet nu verschillende security opties

### Stap 3: Open WAF
1. Klik op **"WAF"** (Web Application Firewall)
2. Je ziet nu verschillende tabs: Overview, Custom rules, Firewall rules, etc.

### Stap 4: IP Access Rules (Eenvoudigste Methode)
1. Scroll naar beneden naar de **"Tools"** sectie
2. Klik op **"IP Access Rules"**
3. Je ziet een lijst met bestaande rules
4. Klik op **"Create rule"** of **"Add rule"** (rechtsboven)

### Stap 5: Configureer de Rule
1. **Action dropdown:** Selecteer **"Allow"**
2. **IP Address or IP Range field:** 
   - Voer Vercel IP ranges in (bijv. `76.76.21.0/24`)
   - Voor meerdere ranges, voer ze in gescheiden door komma's of maak meerdere rules
3. **Note (optioneel):** "Vercel Serverless Functions"
4. Klik op **"Save"**

### Stap 6: Verifieer
1. De rule verschijnt nu in de lijst
2. Test door een request te maken vanuit Vercel
3. Check **Security → Events** om te zien of requests worden toegestaan

---

## Belangrijke Tips

### ✅ Do's:
- Gebruik CIDR notation voor IP ranges (`/24`, `/16`, etc.)
- Voeg een duidelijke note toe aan elke rule
- Test de whitelist na het aanmaken
- Check regelmatig of Vercel IP ranges zijn veranderd

### ❌ Don'ts:
- Whitelist niet te breed (gebruik specifieke ranges)
- Vergeet niet de rule te activeren/save
- Verwijder niet per ongeluk andere belangrijke rules

---

## Troubleshooting

### Rule werkt niet?
1. Check of de rule is **"Enabled"** (actief)
2. Check de **priority** - Allow rules moeten hogere prioriteit hebben
3. Check of er andere rules zijn die de request blokkeren
4. Check **Security → Events** om te zien wat er gebeurt met requests

### IP Ranges niet gevonden?
1. Check Vercel documentatie: https://vercel.com/docs/security/ip-addresses
2. Contact Vercel support voor actuele IP ranges
3. Gebruik Vercel API om ranges op te halen

### Nog steeds geblokkeerd?
1. Check of Bot Protection is uitgeschakeld voor API endpoints
2. Maak een exception voor `/rest/V1/*` paths
3. Check Security → Events voor specifieke block redenen

---

## Alternatief: Bot Protection Aanpassen

Als whitelisting niet werkt, pas dan Bot Protection aan:

1. Ga naar **Security → Bots**
2. Klik op **"Super Bot Fight Mode"** of **"Bot Fight Mode"**
3. Maak een **Exception** voor:
   - **Path:** `/rest/V1/*`
   - **Action:** Allow
4. Of zet Bot Protection uit voor specifieke paths

---

## Contact

Als je hulp nodig hebt:
- Cloudflare Support: https://support.cloudflare.com
- Vercel Support: https://vercel.com/support
- Check Cloudflare Community Forums

