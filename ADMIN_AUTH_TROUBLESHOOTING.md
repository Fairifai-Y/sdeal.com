# Admin Authentication Troubleshooting

## Probleem: Wachtwoord werkt niet ondanks dat het in Vercel staat

### Mogelijke Oorzaken:

1. **Environment Variable niet correct ingesteld**
   - Check of `ADMIN_PASSWORD` exact hetzelfde is als wat je intypt
   - Check voor extra spaties aan begin/einde
   - Check of het in de juiste environment staat (Production/Preview/Development)

2. **Redeploy nodig na het instellen van environment variable**
   - Environment variables worden alleen geladen tijdens build
   - Na het instellen van `ADMIN_PASSWORD` moet je een redeploy doen

3. **Whitespace issues**
   - Vercel kan soms extra whitespace toevoegen
   - De code trimt nu automatisch whitespace

4. **Browser cache**
   - Oude JavaScript code kan gecached zijn
   - Probeer hard refresh (Ctrl+Shift+R) of incognito mode

### Debug Stappen:

1. **Check Vercel Logs:**
   - Ga naar Vercel Dashboard → Project → Logs
   - Probeer in te loggen
   - Kijk naar logs met `[Admin Auth]` prefix
   - Je zou moeten zien:
     - `ADMIN_PASSWORD is set: true/false`
     - `Password provided: Yes/No`
     - `Comparing passwords (lengths match): true/false`
     - `Password verified successfully` of `Password mismatch`

2. **Check Environment Variable:**
   - Ga naar Vercel Dashboard → Project → Settings → Environment Variables
   - Check of `ADMIN_PASSWORD` bestaat
   - Check of het in alle environments staat (Production, Preview, Development)
   - Check of er geen extra spaties zijn

3. **Test met een eenvoudig wachtwoord:**
   - Zet tijdelijk een eenvoudig wachtwoord in Vercel (bijv. `test123`)
   - Redeploy
   - Probeer in te loggen met `test123`
   - Als dat werkt, is het probleem waarschijnlijk whitespace of speciale karakters

4. **Check Vercel Deployment:**
   - Ga naar Deployments
   - Check of de laatste deployment succesvol was
   - Check of de deployment na het instellen van `ADMIN_PASSWORD` was

### Veelvoorkomende Problemen:

**Probleem:** "Admin authentication is not configured"
- **Oplossing:** `ADMIN_PASSWORD` is niet ingesteld of niet geladen tijdens build
- **Fix:** Zet `ADMIN_PASSWORD` in Vercel en redeploy

**Probleem:** "Incorrect password" maar wachtwoord klopt
- **Oplossing:** Whitespace of speciale karakters
- **Fix:** Check logs voor password lengths, trim het wachtwoord in Vercel

**Probleem:** Login werkt lokaal maar niet in productie
- **Oplossing:** Environment variable niet ingesteld in Vercel
- **Fix:** Zet `ADMIN_PASSWORD` in Vercel environment variables

### Test Script:

Je kunt de auth endpoint testen met:

```bash
curl -X POST https://www.sdeal.com/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"jouw-wachtwoord"}'
```

Dit zou een JSON response moeten geven met `success: true` en een `token` als het wachtwoord correct is.

