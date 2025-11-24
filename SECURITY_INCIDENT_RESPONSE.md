# Security Incident Response - Exposed Database Credentials

## ⚠️ CRITICAL: Database credentials zijn blootgesteld in GitHub

**Datum:** 23 november 2025  
**Detectie:** GitGuardian heeft PostgreSQL URI gedetecteerd in repository

## Onmiddellijke acties vereist:

### 1. 🔐 Database Password Roteren (URGENT - Doe dit NU)

De database credentials zijn publiek zichtbaar. Je moet **onmiddellijk** het database password wijzigen:

1. **Ga naar Neon Dashboard:**
   - Login op https://console.neon.tech
   - Selecteer je project/database

2. **Reset Database Password:**
   - Ga naar **Settings** → **Database** → **Reset Password**
   - Genereer een nieuw sterk password
   - **Sla het nieuwe password veilig op** (gebruik een password manager)

3. **Update Environment Variables:**
   - **Vercel:** Ga naar Project → Settings → Environment Variables
     - Update `DATABASE_URL` met het nieuwe password
     - Format: `postgresql://username:NEW_PASSWORD@ep-xxx-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=15`
   - **Lokaal:** Update `server/.env` met het nieuwe password
   - **Redeploy** je Vercel project na het updaten

### 2. 🧹 Git History Opschonen

De credentials staan nog in de Git history. Je moet deze verwijderen:

**Optie A: BFG Repo-Cleaner (Aanbevolen)**
```bash
# Installeer BFG
# Download van: https://rtyley.github.io/bfg-repo-cleaner/

# Clone een fresh copy van je repo
git clone --mirror https://github.com/Fairifai-Y/sdeal.com.git

# Verwijder credentials uit history
java -jar bfg.jar --replace-text passwords.txt sdeal.com.git

# Push changes
cd sdeal.com.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push
```

**Optie B: Git Filter-Branch (Alternatief)**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch LOCAL_TESTING.md DATABASE_SETUP.md DATABASE_CONNECTION_OPTIMIZATION.md" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WAARSCHUWING: Dit overschrijft history)
git push origin --force --all
```

**⚠️ WAARSCHUWING:** Force push kan problemen veroorzaken voor andere developers. Communiceer dit eerst met je team!

### 3. ✅ Verificatie

Na het roteren van het password en opschonen van Git history:

1. **Test database connectie:**
   ```bash
   cd server
   node check-env.js
   ```

2. **Test applicatie:**
   - Controleer of de app nog werkt na password update
   - Test database queries

3. **Controleer GitGuardian:**
   - Wacht 24-48 uur
   - Controleer of GitGuardian nog steeds alerts geeft
   - Als er nog alerts zijn, zijn er mogelijk nog credentials in de history

### 4. 🔒 Preventie voor de toekomst

**Zorg dat deze bestanden in `.gitignore` staan:**
- ✅ `.env`
- ✅ `.env.*`
- ✅ `*.env`
- ✅ `server/.env`

**Best practices:**
- ❌ **NOOIT** credentials in code committen
- ❌ **NOOIT** credentials in documentatie (gebruik placeholders)
- ✅ Gebruik altijd environment variables
- ✅ Gebruik een secret manager (bijv. Vercel Environment Variables, AWS Secrets Manager)
- ✅ Gebruik pre-commit hooks om credentials te detecteren

**Pre-commit hook toevoegen:**
```bash
# scripts/prevent-secrets.sh bestaat al
# Voeg toe aan .git/hooks/pre-commit:
#!/bin/sh
./scripts/prevent-secrets.sh
```

### 5. 📋 Checklist

- [ ] Database password geroteerd in Neon
- [ ] `DATABASE_URL` geüpdatet in Vercel Environment Variables
- [ ] `server/.env` geüpdatet lokaal
- [ ] Vercel project gere-deployed
- [ ] Database connectie getest
- [ ] Applicatie getest
- [ ] Git history opgeschoond (optioneel, maar aanbevolen)
- [ ] Team geïnformeerd over password wijziging
- [ ] GitGuardian alerts gemonitord (24-48 uur)

## Hulp nodig?

Als je hulp nodig hebt met het roteren van het password of het opschonen van Git history, vraag hulp aan je team of een DevOps engineer.

