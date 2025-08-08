# 🚀 RestoPlanner Deployment naar innovatiostudio.be/restoplanner

## 📋 Overzicht

Deze gids helpt je om RestoPlanner te deployen naar `innovatiostudio.be/restoplanner` via Combell hosting.

## 🎯 Deployment Stappen

### **Stap 1: Combell Dashboard Configuratie**

1. **Log in op Combell Dashboard**

   - Ga naar [combell.com](https://combell.com)
   - Log in op je account

2. **Ga naar Node.js Sectie**

   - Zoek naar "Node.js" in je dashboard
   - Klik op "Add instance" of "Nieuwe Node.js instance"

3. **Configureer de Instance**
   - **Git Repository**: `https://github.com/NikiDK2/dine-wise.git`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Serve Command**: `npm run serve`
   - **Base Path**: `/restoplanner`
   - **Domain**: `innovatiostudio.be`

### **Stap 2: Environment Variabelen Instellen**

In je Combell dashboard, voeg deze environment variabelen toe:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://innovatiostudio.be
CORS_ORIGIN=https://innovatiostudio.be
BASE_PATH=/restoplanner
```

### **Stap 3: Domain Configuratie**

1. **Ga naar "Websites & SSL"**

   - Klik op de link in je Node.js dashboard
   - Voeg `innovatiostudio.be` toe aan de Node.js instance

2. **SSL Certificaat**
   - Combell biedt gratis SSL certificaten
   - Activeer SSL voor `innovatiostudio.be`

### **Stap 4: Subdirectory Routing**

De applicatie is geconfigureerd voor `/restoplanner` subdirectory:

- **Vite Config**: `base: "/restoplanner/"`
- **React Router**: `basename="/restoplanner"`
- **Server**: Handelt `/restoplanner` requests af

### **Stap 5: Deployment Pipeline**

1. **Automatische Build**

   - Combell zal automatisch `npm run build` uitvoeren
   - Dit genereert de `dist` folder met je React app

2. **Automatische Start**
   - Na succesvolle build start Combell `npm run serve`
   - Je app is nu online beschikbaar op `innovatiostudio.be/restoplanner`

## 🌐 Na Deployment

### **Je applicatie URL wordt:**

```
https://innovatiostudio.be/restoplanner
```

### **API Endpoints:**

```
https://innovatiostudio.be/restoplanner/api/health
https://innovatiostudio.be/restoplanner/api/agenda/health
https://innovatiostudio.be/restoplanner/api/reservations/check-availability
```

### **Test je applicatie:**

```bash
# Health check
curl https://innovatiostudio.be/restoplanner/health

# Test agenda endpoints
curl https://innovatiostudio.be/restoplanner/api/agenda/health
```

## 🔧 Configuratie Details

### **Vite Configuratie:**

```typescript
// vite.config.ts
export default defineConfig({
  base: "/restoplanner/",
  // ... rest van config
});
```

### **React Router Configuratie:**

```typescript
// src/App.tsx
<BrowserRouter basename="/restoplanner">
  <Routes>// ... routes</Routes>
</BrowserRouter>
```

### **Server Configuratie:**

```javascript
// server-minimal.js
// Handle /restoplanner subdirectory
if (filePath.startsWith("/restoplanner")) {
  filePath = filePath.replace("/restoplanner", "");
}
```

## 🛠️ Troubleshooting

### **"404 Not Found"**

- Controleer of de base path correct is ingesteld in Combell
- Zorg dat de server `/restoplanner` requests correct afhandelt

### **"Static Files Not Loading"**

- Controleer of Vite `base: "/restoplanner/"` is ingesteld
- Zorg dat assets correct worden geladen

### **"React Router Not Working"**

- Controleer of `basename="/restoplanner"` is ingesteld
- Test directe URL toegang naar routes

## 📊 Monitoring

- **Logs**: Bekijk build en runtime logs in Combell dashboard
- **Status**: Controleer of je app draait op `innovatiostudio.be/restoplanner`
- **Performance**: Monitor CPU en geheugengebruik

## 🔄 Continuous Deployment

- **Elke push naar GitHub** triggert automatische deployment
- **Combell bouwt en deployt** automatisch
- **Geen handmatige actie** nodig

## 🎉 Klaar!

Na deployment is je RestoPlanner applicatie beschikbaar op:

**🌐 https://innovatiostudio.be/restoplanner**

Je kunt nu de oude deployment op `innovationstudio.be` stoppen en alle verkeer doorsturen naar de nieuwe locatie.

---

**Je RestoPlanner app is nu live op innovatiostudio.be/restoplanner!** 🚀
