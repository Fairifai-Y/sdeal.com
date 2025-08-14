# 🔒 SDeal AdWords Tool - Beveiligde Toegang

## Toegang
- **URL:** `sdeal.com/adwords-tool`
- **Wachtwoord:** `SDealAdWords2024!` (verander dit!)

## Beveiliging
1. **Wachtwoord bescherming** - Alleen jij kent het wachtwoord
2. **IP restrictie** - Kan ingesteld worden in .htaccess
3. **Geen publieke toegang** - Tool is verborgen voor zoekmachines

## Setup voor productie
1. **Verander het wachtwoord** in `index.html` regel 89
2. **Activeer IP restrictie** in `.htaccess` (uncomment en vul jouw IP in)
3. **Maak .htpasswd bestand** voor extra beveiliging

## Wachtwoord wijzigen
Open `index.html` en verander regel 89:
```javascript
const correctPassword = 'JOUW_NIEUWE_WACHTWOORD';
```

## IP restrictie instellen
1. Vind jouw IP: https://whatismyipaddress.com/
2. Open `.htaccess`
3. Uncomment de IP restrictie regels
4. Vervang `YOUR_IP_ADDRESS_HERE` door jouw IP

## Extra beveiliging
Voor nog meer beveiliging:
1. Maak een `.htpasswd` bestand
2. Activeer basis authenticatie in `.htaccess`
3. Voeg SSL certificaat toe

## Troubleshooting
- **Tool laadt niet:** Controleer of AdWords server draait op poort 8081
- **Wachtwoord werkt niet:** Controleer JavaScript console voor fouten
- **IP geblokkeerd:** Controleer .htaccess configuratie
