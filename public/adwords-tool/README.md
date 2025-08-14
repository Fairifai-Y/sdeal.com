# 🔒 SDeal AdWords Tool - Volledig Geïntegreerd

## Toegang
- **URL:** `sdeal.com/adwords-tool`
- **Wachtwoord:** `SDealAdWords2024!` (verander dit!)
- **Tool URL:** `sdeal.com/adwords-tool/app` (na login)

## Beveiliging
1. **Wachtwoord bescherming** - Alleen jij kent het wachtwoord
2. **IP restrictie** - Kan ingesteld worden in .htaccess
3. **Geen publieke toegang** - Tool is verborgen voor zoekmachines
4. **Volledig geïntegreerd** - Draait op je bestaande SDeal server

## Functionaliteit
- ✅ **Label Discovery** - Ontdek Google Ads labels
- ✅ **Campaign Creation** - Maak campagnes aan
- ✅ **Preview Mode** - Bekijk campagnes voor aanmaak
- ✅ **Demo Mode** - Veilige test functionaliteit

## Setup voor productie
1. **Verander het wachtwoord** in `index.html` regel 89
2. **Activeer IP restrictie** in `.htaccess` (uncomment en vul jouw IP in)
3. **Zorg dat .env bestand** in de root staat met Google Ads credentials
4. **Start je SDeal server** - Tool is geïntegreerd

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

## Volledige integratie
De tool is nu volledig geïntegreerd in je SDeal server:
- **Geen aparte servers** nodig
- **Geen localhost** redirects
- **Alles draait online** op sdeal.com
- **API routes** in server.js

## Troubleshooting
- **Tool laadt niet:** Controleer of SDeal server draait
- **Wachtwoord werkt niet:** Controleer JavaScript console voor fouten
- **API errors:** Controleer server logs
- **Credentials:** Zorg dat .env bestand correct is
