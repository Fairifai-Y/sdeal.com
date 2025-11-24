# SendGrid Webhook Setup

## Overzicht

De email tracking functionaliteit (opens, clicks, delivered, bounces) werkt via SendGrid webhooks. SendGrid stuurt automatisch events naar onze webhook endpoint wanneer emails worden geopend, geklikt, of andere events plaatsvinden.

## Webhook Endpoint

**URL:** `https://www.sdeal.com/api/admin/mailing/webhook`

## SendGrid Configuratie

### Stap 1: Log in op SendGrid Dashboard

1. Ga naar [SendGrid Dashboard](https://app.sendgrid.com/)
2. Log in met je SendGrid account

### Stap 2: Configureer Event Webhook

1. Ga naar **Settings** → **Mail Settings** → **Event Webhook**
2. Klik op **Create Webhook**
3. Vul de volgende gegevens in:
   - **HTTP POST URL:** `https://www.sdeal.com/api/admin/mailing/webhook`
   - **Name:** SDeal Email Tracking
   - **Enabled Events:** Selecteer de volgende events:
     - ✅ **Delivered** - Email is succesvol afgeleverd
     - ✅ **Opened** - Email is geopend
     - ✅ **Clicked** - Link in email is geklikt
     - ✅ **Bounce** - Email is gebounced
     - ✅ **Unsubscribe** - Gebruiker heeft zich uitgeschreven
     - ✅ **Spam Report** - Email is gemarkeerd als spam
     - ✅ **Dropped** - Email is gedropt (optioneel)
     - ✅ **Deferred** - Email is uitgesteld (optioneel)

4. Klik op **Save**

### Stap 3: Test de Webhook

1. Stuur een test email via een campagne
2. Open de email en klik op een link
3. Check de logs in Vercel om te zien of events worden ontvangen
4. Check de Admin interface → Mailing → Campagnes om te zien of opens/clicks worden geteld

## Hoe het werkt

1. **Email wordt verzonden:**
   - Campaign email wordt verzonden via SendGrid
   - `customArgs` worden meegestuurd met `campaignId` en `consumerId`

2. **SendGrid stuurt webhook events:**
   - Wanneer email wordt geopend → `open` event
   - Wanneer link wordt geklikt → `click` event
   - Wanneer email wordt afgeleverd → `delivered` event
   - Etc.

3. **Webhook endpoint verwerkt events:**
   - Events worden opgeslagen in `EmailEvent` tabel
   - Campaign statistieken worden bijgewerkt (`totalOpened`, `totalClicked`, etc.)
   - Consumer statistieken worden bijgewerkt (`lastEmailOpenedAt`, `totalEmailsOpened`, etc.)

## Tracking Data

### Campaign Statistieken
- `totalDelivered` - Aantal emails afgeleverd
- `totalOpened` - Aantal emails geopend
- `totalClicked` - Aantal keer geklikt
- `totalBounced` - Aantal bounces
- `totalUnsubscribed` - Aantal uitschrijvingen

### Consumer Statistieken
- `lastEmailOpenedAt` - Laatste keer email geopend
- `lastEmailClickedAt` - Laatste keer link geklikt
- `totalEmailsOpened` - Totaal aantal emails geopend
- `totalEmailsClicked` - Totaal aantal keer geklikt

### EmailEvent Records
Elk event wordt opgeslagen met:
- `eventType` - Type event (opened, clicked, delivered, bounced, etc.)
- `occurredAt` - Wanneer het event plaatsvond
- `userAgent` - Browser/email client info
- `ipAddress` - IP adres van gebruiker
- `eventData` - Extra data (bijv. geklikte URL voor click events)

## Troubleshooting

### Events worden niet ontvangen

1. **Check SendGrid webhook configuratie:**
   - Is de webhook URL correct?
   - Zijn de events enabled?
   - Is de webhook actief?

2. **Check Vercel logs:**
   - Ga naar Vercel Dashboard → Project → Logs
   - Zoek naar `[Email Webhook]` logs
   - Check voor errors

3. **Test webhook endpoint:**
   - GET request naar `https://www.sdeal.com/api/admin/mailing/webhook`
   - Moet `{ success: true, message: 'SendGrid webhook endpoint is active' }` teruggeven

4. **Check customArgs:**
   - Zorg dat `campaignId` en `consumerId` worden meegestuurd in emails
   - Deze worden automatisch toegevoegd in `api/admin/mailing/campaigns.js`

### Duplicate Events

Het webhook endpoint heeft duplicate detection:
- Events binnen 1 minuut worden genegeerd
- Voor click events wordt ook de URL gecheckt

### Events worden niet getoond in Admin

1. Check of events worden opgeslagen in database
2. Check of campaign statistieken worden bijgewerkt
3. Refresh de Admin interface

## Security

- SendGrid webhooks zijn publiek toegankelijk (nodig voor SendGrid)
- Events worden gevalideerd op basis van `campaignId` en `consumerId`
- Invalid events worden genegeerd
- Webhook endpoint retourneert altijd 200 (om SendGrid retries te voorkomen)

## Monitoring

Check regelmatig:
- Vercel logs voor webhook errors
- Campaign statistieken in Admin interface
- EmailEvent records in database

