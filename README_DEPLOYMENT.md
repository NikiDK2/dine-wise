# 🚀 RestoPlanner API - Deployment Guide

## 📋 Overzicht

Deze gids helpt je om de RestoPlanner Agenda API online te zetten zodat externe programma's er toegang toe hebben.

## 🎯 Aanbevolen: Vercel Deployment

### **Stap 1: GitHub Repository**

1. **Push je code naar GitHub:**
   ```bash
   git add .
   git commit -m "Add API server and deployment config"
   git push origin main
   ```

### **Stap 2: Vercel Account**

1. **Ga naar [vercel.com](https://vercel.com)**
2. **Maak een gratis account aan**
3. **Log in met je GitHub account**

### **Stap 3: Deploy Project**

1. **Klik op "New Project"**
2. **Import je GitHub repository**
3. **Configureer de settings:**
   - **Framework Preset:** Node.js
   - **Root Directory:** `./` (laat leeg)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### **Stap 4: Environment Variables**

1. **Ga naar Project Settings → Environment Variables**
2. **Voeg toe:**
   ```
   VITE_SUPABASE_URL = jouw_supabase_url
   VITE_SUPABASE_ANON_KEY = jouw_supabase_anon_key
   ```

### **Stap 5: Deploy**

1. **Klik op "Deploy"**
2. **Wacht tot deployment klaar is**
3. **Je krijgt een URL zoals:** `https://jouw-project.vercel.app`

## 🔧 Alternatieve Deployment Opties

### **Option A: Railway**

```bash
# Installeer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

### **Option B: Heroku**

```bash
# Installeer Heroku CLI
# Maak account op heroku.com

# Login
heroku login

# Maak app
heroku create jouw-restoplanner-api

# Set environment variables
heroku config:set VITE_SUPABASE_URL=jouw_supabase_url
heroku config:set VITE_SUPABASE_ANON_KEY=jouw_supabase_anon_key

# Deploy
git push heroku main
```

### **Option C: DigitalOcean App Platform**

1. **Maak account op digitalocean.com**
2. **Ga naar App Platform**
3. **Connect je GitHub repository**
4. **Configureer environment variables**
5. **Deploy**

## 🌐 Na Deployment

### **Je API URL wordt:**

```
https://jouw-project.vercel.app/api/agenda
```

### **Test je API:**

```bash
# Health check
curl https://jouw-project.vercel.app/health

# Test agenda endpoints
curl https://jouw-project.vercel.app/api/agenda/stats?restaurant_id=YOUR_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔐 Environment Variables

### **Vercel Environment Variables:**

1. **Ga naar je project dashboard**
2. **Settings → Environment Variables**
3. **Voeg toe:**
   ```
   VITE_SUPABASE_URL = https://jouw-project.supabase.co
   VITE_SUPABASE_ANON_KEY = jouw_anon_key
   ```

### **Hoe vind je je Supabase credentials:**

1. **Log in op [supabase.com](https://supabase.com)**
2. **Selecteer je project**
3. **Ga naar Settings → API**
4. **Kopieer:**
   - **Project URL**
   - **anon public key**

## 📡 API Endpoints na Deployment

### **Basis URL:** `https://jouw-project.vercel.app`

### **Endpoints:**

- **Health Check:** `GET /health`
- **Alle afspraken:** `GET /api/agenda/appointments`
- **Nieuwe afspraak:** `POST /api/agenda/appointments`
- **Update afspraak:** `PUT /api/agenda/appointments/:id`
- **Verwijder afspraak:** `DELETE /api/agenda/appointments/:id`
- **Beschikbaarheid:** `POST /api/agenda/availability`
- **Statistieken:** `GET /api/agenda/stats`
- **Zoeken:** `GET /api/agenda/search`

## 🔄 Continuous Deployment

### **Automatische Updates:**

- **Elke push naar GitHub** triggert automatische deployment
- **Vercel bouwt en deployt** automatisch
- **Geen handmatige actie** nodig

### **Custom Domain (Optioneel):**

1. **Ga naar Project Settings → Domains**
2. **Voeg je eigen domein toe**
3. **Configureer DNS records**

## 🛠️ Troubleshooting

### **"Build Failed"**

- **Controleer logs** in Vercel dashboard
- **Zorg dat alle dependencies** in package.json staan
- **Controleer environment variables**

### **"API Not Found"**

- **Controleer vercel.json** routing configuratie
- **Zorg dat server.js** correct exporteert

### **"Authentication Failed"**

- **Controleer Supabase credentials**
- **Zorg dat environment variables** correct zijn ingesteld

## 📊 Monitoring

### **Vercel Analytics:**

- **Automatische monitoring** van requests
- **Performance metrics**
- **Error tracking**

### **Custom Monitoring:**

```javascript
// Voeg logging toe aan je API
console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
```

## 🎉 Klaar!

Na deployment kun je je HTTP request interface configureren met:

- **URL:** `https://jouw-project.vercel.app/api/agenda/appointments`
- **Headers:** `Authorization: Bearer YOUR_TOKEN`
- **Query:** `restaurant_id=YOUR_RESTAURANT_ID`

Je API is nu beschikbaar voor externe programma's! 🚀
