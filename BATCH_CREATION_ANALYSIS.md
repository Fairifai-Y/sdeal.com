# Batch Creation Analysis - Vercel Timeout Limits

## Huidige Configuratie

- **BATCH_SIZE**: 100 emails per batch
- **CHUNK_SIZE**: 200 recipients per chunk
- **Delay tussen chunks**: 100ms
- **Functie**: Asynchroon aangeroepen (geen await), API response wordt direct teruggestuurd

## Tijd Berekening

### Per Batch (100 emails):
- Email preparation: ~5-10ms per email = 500-1000ms
- Database write: ~50-100ms
- **Totaal per batch: ~600-1100ms**

### Per Chunk (200 recipients = 2 batches):
- Email preparation: 200 × 10ms = 2000ms
- Batch creation (2 batches): 2 × 100ms = 200ms
- Delay: 100ms
- **Totaal per chunk: ~2.3 seconden**

## Vercel Timeout Limieten

### Standaard (zonder maxDuration):
- **Hobby plan**: 10 seconden
- **Pro plan**: 15 seconden (standaard), 60 seconden (max zonder configuratie)
- **Enterprise**: 15 seconden (standaard), 300 seconden (max zonder configuratie)

### Met maxDuration configuratie:
- **Hobby plan**: 300 seconden (5 minuten) max
- **Pro plan**: 300 seconden (5 minuten) standaard, 800 seconden (13 minuten) max
- **Enterprise**: 300 seconden (5 minuten) standaard, 800 seconden (13 minuten) max

## Huidige Capaciteit (zonder maxDuration)

### Pro Plan (60 seconden timeout):
- Chunks per 60s: 60 / 2.3 = ~26 chunks
- Recipients: 26 × 200 = **~5,200 recipients**
- Batches: 5,200 / 100 = **~52 batches**

### Enterprise (300 seconden timeout):
- Chunks per 300s: 300 / 2.3 = ~130 chunks
- Recipients: 130 × 200 = **~26,000 recipients**
- Batches: 26,000 / 100 = **~260 batches**

## Huidige Capaciteit (met maxDuration = 300s)

### Alle Plannen (300 seconden):
- Chunks per 300s: 300 / 2.3 = ~130 chunks
- Recipients: 130 × 200 = **~26,000 recipients**
- Batches: 26,000 / 100 = **~260 batches**

## Huidige Capaciteit (met maxDuration = 800s - Pro/Enterprise)

### Pro/Enterprise (800 seconden):
- Chunks per 800s: 800 / 2.3 = ~347 chunks
- Recipients: 347 × 200 = **~69,400 recipients**
- Batches: 69,400 / 100 = **~694 batches**

## Risico's

1. **Asynchrone functie kan worden gekilled**: Hoewel de API response direct wordt teruggestuurd, kan Vercel de achtergrond functie nog steeds killen als deze te lang duurt
2. **Geen progress tracking**: Als de functie wordt gekilled, is er geen manier om te zien hoeveel batches al zijn aangemaakt
3. **Geen retry mechanisme**: Als de functie faalt, moeten alle batches opnieuw worden aangemaakt

## Aanbevelingen

1. **Voeg maxDuration toe** aan `vercel.json` voor de campaigns endpoint (300s of 800s)
2. **Verhoog CHUNK_SIZE** naar 500-1000 om minder database calls te maken
3. **Verwijder delay** tussen chunks (niet nodig als we in chunks werken)
4. **Voeg progress tracking toe** door batches incrementally te saven en status te updaten
5. **Overweeg een queue systeem** voor zeer grote campagnes (>50k recipients)

