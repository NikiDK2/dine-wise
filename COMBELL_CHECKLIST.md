# Combell Deployment Checklist

## ✅ Configuratie Bestanden

### 1. package.json

- [x] `"serve": "node server-combell-simple.js"` - Ultra-eenvoudig serve script
- [x] `"build": "npx vite build"` - Correct build script
- [x] `"start": "node server-combell-simple.js"` - Ultra-eenvoudig start script
- [x] Express versie 4.18.2 (stabiel)
- [x] Node.js engine >=18.0.0

### 2. combell.json

- [x] `"build": "npm install && npx vite build && ls -la dist"` - Build met verificatie
- [x] `"serve": "node server-combell-simple.js"` - Ultra-eenvoudig serve commando
- [x] Environment variabelen geconfigureerd
- [x] Base path: `/RestPlanner`
- [x] Domain: `innovationstudio.be`

### 3. server-combell-simple.js

- [x] Ultra-minimale server configuratie
- [x] Base path `/RestPlanner`
- [x] Static files serving
- [x] Health check route
- [x] React app routing
- [x] Geen complexe middleware

## ✅ Environment Variabelen

### Combell Dashboard Instellingen:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://innovationstudio.be
CORS_ORIGIN=https://innovationstudio.be
```

## ✅ Combell Dashboard Configuratie

### Node.js Instance Instellingen:

- [ ] **Git Repository**: `https://github.com/NikiDK2/dine-wise.git`
- [ ] **Branch**: `main`
- [ ] **Build Command**: `npm run build`
- [ ] **Serve Command**: `npm run serve`
- [ ] **Base Path**: `/RestPlanner`
- [ ] **Domain**: `innovationstudio.be`

## ✅ Deployment Stappen

### 1. GitHub Push

```bash
git add .
git commit -m "Combell deployment ready - fixed build script"
git push origin main
```

### 2. Combell Pipeline

- [ ] Combell detecteert automatisch wijzigingen
- [ ] Voert `npm run build` uit
- [ ] Start applicatie met `npm run serve`

### 3. Verificatie

- [ ] **API Health**: https://innovationstudio.be/api/health
- [ ] **Frontend**: https://innovationstudio.be/RestPlanner
- [ ] **SSL Certificaat**: Actief
- [ ] **Domain Routing**: Correct geconfigureerd

## ✅ Troubleshooting

### Build Fails

- Controleer build logs in Combell dashboard
- Zorg dat alle dependencies in package.json staan
- Node.js versie 18+ is geïnstalleerd

### App Start Fails

- Controleer environment variabelen
- Bekijk error logs in Combell dashboard
- Zorg dat server.js correct is geconfigureerd

### Static Files Niet Geladen

- Controleer of dist folder wordt gegenereerd
- Base path `/RestPlanner` correct ingesteld
- Domain routing geconfigureerd

## ✅ Monitoring

### Combell Dashboard:

- [ ] Build status: Succesvol
- [ ] Runtime status: Actief
- [ ] Logs: Geen errors
- [ ] Performance: Acceptabel

### URLs Testen:

- [ ] https://innovationstudio.be/api/health
- [ ] https://innovationstudio.be/RestPlanner
- [ ] https://innovationstudio.be/RestPlanner/auth
- [ ] https://innovationstudio.be/RestPlanner/reservations

---

**Status**: ✅ Klaar voor Combell Deployment
**Laatste update**: Server configuratie gefixt, build script gecorrigeerd
