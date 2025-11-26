# SendGrid Webhook Uitleg en Configuratie

## Huidige Implementatie

### Hoe het nu werkt:

1. **Custom Args in Emails:**
   - Wanneer emails worden verstuurd via dit project, worden `customArgs` toegevoegd aan elk email:
     ```javascript
     customArgs: {
       campaignId: campaignId,
       consumerId: consumer.id
     }
     ```
   - Deze `customArgs` worden door SendGrid meegestuurd in alle webhook events (open, click, bounce, etc.)

2. **Webhook Endpoint:**
   - Endpoint: `/api/admin/mailing/webhook`
   - Ontvangt POST requests van SendGrid met event data
   - Extract `campaignId` en `consumerId` uit `customArgs`
   - Als `customArgs` ontbreken, gebruikt het een fallback (zoekt consumer by email)

3. **Probleem:**
   - **Alle emails** die via jouw SendGrid account worden verstuurd (ook via Magento) komen naar dezelfde webhook
   - Als Magento emails verstuurt **zonder** `customArgs`, kan de webhook deze proberen te verwerken
   - Dit kan leiden tot:
     - Errors (campaignId/consumerId niet gevonden)
     - Onjuiste data (fallback kan verkeerde campaign vinden)
     - Performance issues (onnodige database queries)

## Oplossingen

### Optie 1: Source Identifier in Custom Args (Aanbevolen)

**Voeg een `source` identifier toe aan customArgs** om te onderscheiden welke emails van dit project komen:

```javascript
customArgs: {
  source: 'sdeal-mailing',  // Unieke identifier voor dit project
  campaignId: campaignId,
  consumerId: consumer.id
}
```

**Webhook check:**
```javascript
// Alleen verwerken als source = 'sdeal-mailing'
if (customArgsObj.source !== 'sdeal-mailing') {
  console.log(`[Email Webhook] Skipping event - not from SDeal mailing system (source: ${customArgsObj.source || 'none'})`);
  continue; // Skip deze event
}
```

**Voordelen:**
- ✅ Eenvoudig te implementeren
- ✅ Geen impact op Magento emails
- ✅ Duidelijk onderscheid tussen systemen
- ✅ Geen SendGrid configuratie nodig

### Optie 2: Separate SendGrid API Key

**Gebruik een aparte SendGrid API key voor dit project:**
- Huidige key: Voor Magento
- Nieuwe key: Voor SDeal mailing systeem
- Configureer webhook alleen voor de nieuwe key

**Voordelen:**
- ✅ Volledige scheiding tussen systemen
- ✅ Geen risico op conflicten
- ✅ Onafhankelijke rate limits

**Nadelen:**
- ❌ Extra SendGrid account/subscription nodig
- ❌ Extra configuratie

### Optie 3: Multiple Webhook Endpoints (SendGrid Event Webhook)

**SendGrid ondersteunt meerdere webhook endpoints:**
- Configureer 2 webhooks in SendGrid:
  1. Webhook 1: Voor Magento (bestaande endpoint)
  2. Webhook 2: Voor SDeal mailing (`/api/admin/mailing/webhook`)

**Filtering via SendGrid:**
- Gebruik SendGrid's filtering opties om events te routeren
- Bijvoorbeeld: filter op `from_email` of `custom_args.source`

**Voordelen:**
- ✅ Flexibele routing
- ✅ Geen code changes nodig

**Nadelen:**
- ❌ Complexere SendGrid configuratie
- ❌ SendGrid filtering kan beperkt zijn

### Optie 4: From Email Check

**Check het `from` email adres in de webhook:**
```javascript
// Alleen verwerken als from email = mailing@sdeal.com
if (event.from && !event.from.includes('mailing@sdeal.com')) {
  console.log(`[Email Webhook] Skipping event - not from mailing@sdeal.com (from: ${event.from})`);
  continue;
}
```

**Voordelen:**
- ✅ Eenvoudig
- ✅ Geen customArgs nodig

**Nadelen:**
- ❌ Minder betrouwbaar (from kan worden gespoofed)
- ❌ Werkt niet als Magento ook mailing@sdeal.com gebruikt

## Aanbevolen Oplossing: Optie 1 + Optie 4 Combinatie

**Implementeer beide checks voor maximale zekerheid:**

1. **Source identifier** in customArgs
2. **From email check** als backup
3. **Strikte validatie** - skip events zonder beide identifiers

Dit geeft:
- ✅ Duidelijk onderscheid (source identifier)
- ✅ Extra beveiliging (from email check)
- ✅ Geen impact op Magento
- ✅ Eenvoudig te implementeren

## Implementatie

### Stap 1: Update Email Creation
Voeg `source` toe aan customArgs in `api/admin/mailing/campaigns.js`:
```javascript
customArgs: {
  source: 'sdeal-mailing',
  campaignId: campaignId,
  consumerId: consumer.id
}
```

### Stap 2: Update Webhook
Voeg source check toe in `api/admin/mailing/webhook.js`:
```javascript
// Check if this event is from our mailing system
const source = customArgsObj.source || customArgsObj.source_id;
if (source !== 'sdeal-mailing') {
  console.log(`[Email Webhook] Skipping event - not from SDeal mailing system (source: ${source || 'none'})`);
  continue;
}
```

### Stap 3: SendGrid Webhook Configuratie
1. Ga naar SendGrid Dashboard → Settings → Mail Settings → Event Webhook
2. Configureer webhook URL: `https://www.sdeal.com/api/admin/mailing/webhook`
3. Selecteer events: `open`, `click`, `delivered`, `bounce`, `unsubscribe`, `spamreport`
4. **Belangrijk:** Deze webhook ontvangt ALLE events van jouw SendGrid account
5. De source check in de code filtert automatisch welke events verwerkt worden

## Huidige Risico's

### Wat kan er misgaan:

1. **Magento emails zonder customArgs:**
   - Webhook probeert fallback (zoek consumer by email)
   - Kan verkeerde campaign vinden
   - Kan onjuiste statistieken veroorzaken

2. **Magento emails met andere customArgs:**
   - Webhook probeert campaignId/consumerId te vinden
   - Fails als deze niet bestaan in onze database
   - Logs errors maar verwerkt niet (goed)

3. **Performance:**
   - Elke Magento email trigger een database query (fallback)
   - Kan database belasten bij veel Magento emails

## Testen

### Test Scenario's:

1. **Email van dit project:**
   - ✅ Moet worden verwerkt
   - ✅ CustomArgs aanwezig
   - ✅ Source = 'sdeal-mailing'

2. **Email van Magento:**
   - ❌ Moet worden geskipped
   - ❌ Geen customArgs of andere source
   - ❌ Geen database updates

3. **Email zonder customArgs:**
   - ❌ Moet worden geskipped (na source check)
   - ❌ Geen fallback lookup

## Conclusie

**Huidige situatie:** Webhook kan conflicten hebben met Magento emails
**Aanbevolen oplossing:** Voeg `source: 'sdeal-mailing'` toe aan customArgs en check dit in de webhook
**Resultaat:** Alleen emails van dit project worden verwerkt, Magento emails worden genegeerd

