# 🚀 Vercel Deployment Guide voor AdWords Tool

## Stap 1: Voorbereiding

1. **Rename bestanden voor Vercel:**
   ```bash
   # Rename de Vercel-optimized versie
   mv simple_web_vercel.py simple_web.py
   mv requirements-vercel.txt requirements.txt
   ```

2. **Zorg dat je deze bestanden hebt:**
   - ✅ `simple_web.py` (Vercel-optimized versie)
   - ✅ `vercel.json` (Vercel configuratie)
   - ✅ `requirements.txt` (Vercel dependencies)
   - ✅ `src/client_utils.py` (Google Ads client utility)

## Stap 2: Environment Variables in Vercel

1. **Ga naar je Vercel dashboard**
2. **Selecteer je project**
3. **Ga naar Settings → Environment Variables**
4. **Voeg deze environment variables toe:**

   ```
   developer_token: YOUR_DEVELOPER_TOKEN
   client_id: YOUR_CLIENT_ID
   client_secret: YOUR_CLIENT_SECRET
   refresh_token: YOUR_REFRESH_TOKEN
   login_customer_id: YOUR_LOGIN_CUSTOMER_ID
   use_proto_plus: true
   ```

5. **Selecteer alle environments (Production, Preview, Development)**
6. **Klik op Save**

## Stap 3: Deployment

### Optie A: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Optie B: Via GitHub Integration
1. **Push je code naar GitHub**
2. **Connect je repository aan Vercel**
3. **Vercel zal automatisch deployen**

### Optie C: Via Vercel Dashboard
1. **Upload de adwords-tool map naar Vercel**
2. **Vercel detecteert automatisch de Python app**

## Stap 4: Custom Domain (Optioneel)

1. **Ga naar je Vercel project dashboard**
2. **Settings → Domains**
3. **Voeg toe:** `adwords-tool.sdeal.com`
4. **Configure DNS records zoals aangegeven**

## Stap 5: Test de Deployment

1. **Ga naar je Vercel URL:** `https://your-project.vercel.app`
2. **Test de Label Discovery:**
   - Customer ID: `YOUR_CUSTOMER_ID`
   - Klik op "Discover Labels"

## 🔒 Security voor Vercel

### Environment Variables
- ✅ Credentials zijn veilig opgeslagen in Vercel
- ✅ Niet zichtbaar in de code
- ✅ Versleuteld opgeslagen

### Access Control
- ✅ Overweeg IP whitelisting via Vercel Edge Functions
- ✅ Voeg authentication toe indien nodig

## 📊 Monitoring

### Vercel Analytics
- **Function Logs:** Vercel dashboard → Functions
- **Performance:** Vercel dashboard → Analytics
- **Errors:** Vercel dashboard → Functions → Error logs

### Health Check
```bash
curl https://your-project.vercel.app/api/discover-labels
```

## 🔧 Troubleshooting

### Veelvoorkomende problemen:

1. **"Module not found" errors:**
   - Check `requirements.txt`
   - Zorg dat alle dependencies correct zijn

2. **Environment variables niet geladen:**
   - Check Vercel dashboard → Environment Variables
   - Zorg dat ze voor alle environments zijn ingesteld

3. **Google Ads API errors:**
   - Check credentials in Vercel environment variables
   - Test lokaal eerst met `test_api_version.py`

4. **Function timeout:**
   - Vercel heeft een 30-seconden timeout
   - Complexe operaties kunnen timeouts veroorzaken

## 🌐 Final URLs

Na deployment:
- **Vercel URL:** `https://your-project.vercel.app`
- **Custom domain:** `https://adwords-tool.sdeal.com` (indien geconfigureerd)

## 📝 Vercel-specifieke beperkingen

### Serverless Limitations:
- ⚠️ **Function timeout:** Max 30 seconden
- ⚠️ **Cold starts:** Eerste request kan langzaam zijn
- ⚠️ **Memory limits:** 1024MB per function
- ⚠️ **File system:** Read-only, geen permanente opslag

### Aanbevelingen:
- ✅ Gebruik voor demo en testing
- ✅ Voor productie: overweeg traditionele server
- ✅ Complexe operaties: split in kleinere functions

## 🎉 Succes!

Je AdWords Tool is nu live op Vercel! 🚀
