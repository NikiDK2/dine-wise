# RestoPlanner2 - Combell Deployment

## 🚀 Combell Node.js Deployment

### Vereiste Configuratie

#### 1. Combell Dashboard Instellingen

**Git Repository**: `https://github.com/NikiDK2/dine-wise.git`  
**Branch**: `main`  
**Build Command**: `npm run build`  
**Serve Command**: `npm run serve`  
**Base Path**: `/RestPlanner`  
**Domain**: `innovationstudio.be`

#### 2. Environment Variabelen

Voeg deze environment variabelen toe in je Combell dashboard:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://innovationstudio.be
CORS_ORIGIN=https://innovationstudio.be
```

### Deployment Scripts

De applicatie gebruikt de volgende scripts:

- **Build**: `npm run build` - Bouwt de React applicatie
- **Serve**: `npm run serve` - Start de Node.js server
- **Start**: `npm start` - Standaard start commando

### Bestandsstructuur

```
RestoPlanner2/
├── server.js              # Hoofdserver bestand
├── package.json           # Dependencies en scripts
├── combell.json          # Combell configuratie
├── env.example           # Environment variabelen voorbeeld
├── dist/                 # Gebouwde React app (na build)
└── src/
    └── api/
        └── agendaRoutes.js # API routes
```

### Deployment Stappen

1. **Push naar GitHub**
   ```bash
   git add .
   git commit -m "Combell deployment ready"
   git push origin main
   ```

2. **Combell Pipeline**
   - Combell detecteert automatisch de wijzigingen
   - Voert `npm run build` uit
   - Start de applicatie met `npm run serve`

3. **Verificatie**
   - **API Health**: https://innovationstudio.be/api/health
   - **Frontend**: https://innovationstudio.be/RestPlanner

### Troubleshooting

#### Build Fails
- Controleer of alle dependencies in `package.json` staan
- Zorg dat Node.js versie 18+ is geïnstalleerd
- Controleer de build logs in Combell dashboard

#### App Start Fails
- Controleer environment variabelen
- Zorg dat `server.js` correct is geconfigureerd
- Bekijk error logs in Combell dashboard

#### Static Files Niet Geladen
- Zorg dat `dist` folder correct wordt gegenereerd
- Controleer of base path `/RestPlanner` correct is ingesteld

### Monitoring

- **Logs**: Bekijk build en runtime logs in Combell dashboard
- **Status**: Controleer of je app draait
- **Performance**: Monitor CPU en geheugengebruik

### Support

Voor problemen met Combell hosting:
- Combell Support: [support.combell.com](https://support.combell.com)
- Node.js Documentatie: [nodejs.org](https://nodejs.org)

---

**Je RestoPlanner2 app is nu klaar voor Combell deployment!** 🎉 