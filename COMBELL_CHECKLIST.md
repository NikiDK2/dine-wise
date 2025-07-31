# 🚀 Combell Deployment Checklist - RestPlanner

## ✅ **Wat we hebben gedaan:**

- [x] Code geoptimaliseerd voor `/RestPlanner` subdirectory
- [x] Vite configuratie aangepast met `base: "/RestPlanner/"`
- [x] Server configuratie aangepast voor subdirectory routing
- [x] Package.json scripts geüpdatet
- [x] Environment variables geconfigureerd
- [x] Code gepusht naar GitHub

## 📋 **Volgende Stappen in Combell Dashboard:**

### **Stap 1: Controleer Node.js Instance**

1. **Log in op Combell Dashboard**
2. **Ga naar je Node.js instance**
3. **Controleer of de configuratie correct is:**
   - ✅ Git Repository: `https://github.com/NikiDK2/dine-wise.git`
   - ✅ Branch: `main`
   - ✅ Build Command: `npm run build`
   - ✅ Serve Command: `npm run serve`

### **Stap 2: Environment Variables**

Controleer of deze environment variables zijn ingesteld:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://innovationstudio.be
CORS_ORIGIN=https://innovationstudio.be
```

### **Stap 3: Domain Configuratie**

1. **Ga naar "Websites & SSL"**
2. **Voeg domain toe**: `innovationstudio.be`
3. **Configureer subdirectory**: `/RestPlanner`
4. **Activeer SSL certificaat**

### **Stap 4: Trigger Deployment**

1. **Klik op "Deploy" of "Redeploy"**
2. **Wacht tot de build succesvol is**
3. **Controleer de logs voor eventuele fouten**

### **Stap 5: Test de Applicatie**

Na succesvolle deployment, test:

1. **Frontend**: https://innovationstudio.be/RestPlanner
2. **API Health**: https://innovationstudio.be/health
3. **API Endpoints**: https://innovationstudio.be/api/health

## 🔧 **Monitoring**

### **Bekijk Logs**

- Ga naar je Node.js instance in Combell dashboard
- Klik op "Logs" om build en runtime logs te bekijken

### **Check Status**

- Controleer of de app status "Running" is
- Bekijk CPU en geheugengebruik

## 🆘 **Troubleshooting**

### **Build Fails**

- Controleer logs in Combell dashboard
- Zorg dat alle dependencies in `package.json` staan
- Controleer Node.js versie (moet 18+ zijn)

### **App Start Fails**

- Controleer environment variables
- Bekijk runtime logs
- Controleer of port 3001 beschikbaar is

### **Subdirectory Routing Werkt Niet**

- Controleer of `base: "/RestPlanner/"` in `vite.config.ts` staat
- Controleer server.js routing configuratie
- Test of de app bereikbaar is op de juiste URL

## 📞 **Support**

- **Combell Support**: support@combell.com
- **Documentatie**: https://combell.com/en/help

---

## 🎯 **Eindresultaat**

Na deze stappen is je RestPlanner beschikbaar op:
**https://innovationstudio.be/RestPlanner**

### **Beschikbare URLs:**

- 🌐 **Frontend**: https://innovationstudio.be/RestPlanner
- 🔌 **API Health**: https://innovationstudio.be/health
- 📡 **API Endpoints**: https://innovationstudio.be/api/agenda/*
- 🏥 **Health Check**: https://innovationstudio.be/api/health
