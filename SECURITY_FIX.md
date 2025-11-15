# Security Fix: MongoDB Secret Exposure

## Probleem
GitHub heeft een MongoDB Atlas Database URI met credentials gedetecteerd in je repository. Dit betekent dat de secret waarschijnlijk in de git history staat.

## Stappen om op te lossen:

### 1. Roteer MongoDB Credentials (BELANGRIJK!)

**In MongoDB Atlas:**
1. Ga naar https://cloud.mongodb.com
2. Log in op je account
3. Ga naar je project → Database Access
4. Vind de gebruiker waarvan de credentials zijn gelekt
5. Klik op "Edit" → "Edit Password"
6. Genereer een nieuw wachtwoord
7. Sla het nieuwe wachtwoord op (je hebt dit nodig voor stap 3)

### 2. Verwijder secret uit Git History

Run deze commando's in je terminal:

```bash
# Installeer git-filter-repo (als je het nog niet hebt)
# Windows: pip install git-filter-repo
# Mac/Linux: pip3 install git-filter-repo

# Verwijder MongoDB connection strings uit alle commits
git filter-repo --invert-paths --path-glob '*.env' --path-glob 'server/.env' --path-glob '**/.env*'

# OF als je git-filter-repo niet hebt, gebruik BFG Repo-Cleaner:
# Download van: https://rtyley.github.io/bfg-repo-cleaner/
# java -jar bfg.jar --delete-files .env
# java -jar bfg.jar --delete-files server/.env
# git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

**Let op:** Dit herschrijft de git history. Als je al naar GitHub hebt gepusht, moet je force push doen:
```bash
git push origin --force --all
```

### 3. Update Environment Variables

**Lokaal:**
- Update `server/.env` met de nieuwe MongoDB connection string
- Zorg dat `.env` files in `.gitignore` staan (dit is al gedaan)

**Vercel:**
1. Ga naar je Vercel project
2. Settings → Environment Variables
3. Zoek naar MongoDB gerelateerde variables
4. Update of verwijder ze
5. Voeg nieuwe toe met de geroteerde credentials

**GitHub Secrets (als je GitHub Actions gebruikt):**
1. Ga naar je repository → Settings → Secrets and variables → Actions
2. Update of verwijder MongoDB secrets
3. Voeg nieuwe toe met geroteerde credentials

### 4. Verifieer dat .env files genegeerd worden

Run:
```bash
git status
```

Zorg dat geen `.env` files verschijnen in de output.

### 5. Scan op andere secrets

Controleer of er andere secrets in je code staan:
- API keys
- Database passwords
- Private keys
- Tokens

Gebruik tools zoals:
- GitHub Secret Scanning (automatisch)
- `git-secrets` (lokaal)
- `truffleHog` (voor git history scanning)

## Preventie voor de toekomst:

1. **Gebruik altijd environment variables** - Nooit hardcode secrets in code
2. **Gebruik .env.example** - Maak een voorbeeldbestand zonder echte credentials
3. **Git hooks** - Installeer `git-secrets` om te voorkomen dat secrets gecommit worden
4. **Code reviews** - Laat iemand anders je code reviewen voordat je pusht
5. **Secret scanning** - Gebruik tools die automatisch secrets detecteren

## Belangrijk:

⚠️ **Als de secret al publiek is geweest:**
- Roteer ALLE credentials die mogelijk zijn gelekt
- Controleer je MongoDB logs voor verdachte activiteit
- Overweeg om IP whitelisting in te stellen in MongoDB Atlas
- Monitor je database voor ongebruikelijke activiteit

## Hulp nodig?

Als je hulp nodig hebt met het verwijderen van secrets uit git history, kan ik je helpen met de specifieke commando's voor jouw situatie.

