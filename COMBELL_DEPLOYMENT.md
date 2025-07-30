# Combell Node.js Deployment Guide

## 🚀 RestoPlanner2 Deployment naar Combell

### Vereisten
- Combell Node.js hosting account
- Git repository toegang
- Environment variabelen geconfigureerd

### Stap 1: Combell Dashboard Configuratie

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

### Stap 2: Environment Variabelen Instellen

In je Combell dashboard, voeg deze environment variabelen toe:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### Stap 3: Build Configuratie

Je `package.json` heeft al de juiste scripts:

```json
{
  "scripts": {
    "build": "vite build",
    "serve": "NODE_ENV=production node server.js"
  }
}
```

### Stap 4: Server.js Configuratie

Controleer of je `server.js` correct is geconfigureerd voor productie:

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.use('/api', require('./src/api/agendaRoutes'));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Stap 5: Deployment Pipeline

1. **Automatische Build**
   - Combell zal automatisch `npm run build` uitvoeren
   - Dit genereert de `dist` folder met je React app

2. **Automatische Start**
   - Na succesvolle build start Combell `npm run serve`
   - Je app is nu online beschikbaar

### Stap 6: Domain Configuratie

1. **Ga naar "Websites & SSL"**
   - Klik op de link in je Node.js dashboard
   - Voeg je domein toe aan de Node.js instance

2. **SSL Certificaat**
   - Combell biedt gratis SSL certificaten
   - Activeer SSL voor je domein

### Stap 7: Monitoring

- **Logs**: Bekijk build en runtime logs in Combell dashboard
- **Status**: Controleer of je app draait
- **Performance**: Monitor CPU en geheugengebruik

### Troubleshooting

#### Build Fails
- Controleer of alle dependencies in `package.json` staan
- Zorg dat Node.js versie compatibel is (18+)

#### App Start Fails
- Controleer environment variabelen
- Zorg dat `server.js` correct is geconfigureerd
- Bekijk error logs in Combell dashboard

#### Static Files Niet Geladen
- Zorg dat `dist` folder correct wordt gegenereerd
- Controleer of `express.static` correct is geconfigureerd

### Post-Deployment Checklist

- [ ] App is toegankelijk via je domein
- [ ] SSL certificaat is actief
- [ ] Environment variabelen zijn ingesteld
- [ ] Database connectie werkt
- [ ] API endpoints zijn functioneel
- [ ] Frontend laadt correct

### Support

Voor problemen met Combell hosting:
- Combell Support: [support.combell.com](https://support.combell.com)
- Node.js Documentatie: [nodejs.org](https://nodejs.org)

---

**Je RestoPlanner2 app is nu live op Combell!** 🎉
