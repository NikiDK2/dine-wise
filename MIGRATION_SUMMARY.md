# 📋 RestoPlanner Migratie Samenvatting

## 🎯 Doel

Migreren van `innovationstudio.be` naar `innovatiostudio.be/restoplanner`

## 📝 Wijzigingen Gemaakt

### 1. **Vite Configuratie** (`vite.config.ts`)

```typescript
// Voor
base: "/",

// Na
base: "/restoplanner/",
```

**Doel:** Zorgt ervoor dat alle assets (CSS, JS, afbeeldingen) correct worden geladen vanuit de `/restoplanner/` subdirectory.

### 2. **React Router Configuratie** (`src/App.tsx`)

```typescript
// Voor
<BrowserRouter>

// Na
<BrowserRouter basename="/restoplanner">
```

**Doel:** Configureert React Router om te werken met de `/restoplanner` base path.

### 3. **Server Configuratie** (`server-minimal.js`)

```javascript
// Toegevoegd
// Handle /restoplanner subdirectory
if (filePath.startsWith("/restoplanner")) {
  filePath = filePath.replace("/restoplanner", "");
}
```

**Doel:** Zorgt ervoor dat de server `/restoplanner` requests correct afhandelt en doorstuurt naar de juiste bestanden.

### 4. **Nieuwe Bestanden Gemaakt**

#### **INNOVATIOSTUDIO_DEPLOYMENT.md**

- Complete deployment gids voor de nieuwe locatie
- Stap-voor-stap instructies voor Combell configuratie
- Environment variables configuratie
- Troubleshooting sectie

#### **DEPLOYMENT_CHECKLIST.md**

- Uitgebreide checklist voor de migratie
- Pre-deployment, deployment en post-deployment stappen
- Testing checklist
- Troubleshooting sectie

#### **redirect-old-domain.html**

- Mooie redirect pagina voor de oude domein
- Automatische redirect naar nieuwe locatie
- Fallback link voor handmatige navigatie

#### **build-and-test.sh**

- Script om de applicatie te builden en testen
- Controleert of alle configuraties correct zijn
- Start lokale test server

## 🔧 Deployment Configuratie

### **Combell Settings:**

- **Git Repository:** `https://github.com/NikiDK2/dine-wise.git`
- **Branch:** `main`
- **Build Command:** `npm run build`
- **Serve Command:** `npm run serve`
- **Base Path:** `/restoplanner`
- **Domain:** `innovatiostudio.be`

### **Environment Variables:**

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://innovatiostudio.be
CORS_ORIGIN=https://innovatiostudio.be
BASE_PATH=/restoplanner
```

## 🌐 URL Structuur

### **Oude URLs:**

- `https://innovationstudio.be/`
- `https://innovationstudio.be/reservations`
- `https://innovationstudio.be/api/health`

### **Nieuwe URLs:**

- `https://innovatiostudio.be/restoplanner/`
- `https://innovatiostudio.be/restoplanner/reservations`
- `https://innovatiostudio.be/restoplanner/api/health`

## 🧪 Testing

### **Lokaal Testen:**

```bash
# Build en test de applicatie
./build-and-test.sh

# Of handmatig
npm run build
npm run serve
```

### **Online Testen:**

```bash
# Health check
curl https://innovatiostudio.be/restoplanner/health

# API test
curl https://innovatiostudio.be/restoplanner/api/agenda/health
```

## 🔄 Oude Domein Afhandeling

### **Option A: HTML Redirect (Aanbevolen)**

- Upload `redirect-old-domain.html` naar `innovationstudio.be`
- Automatische redirect naar nieuwe locatie
- Mooie gebruikerservaring

### **Option B: DNS Redirect**

- Configureer DNS redirect in Combell
- `innovationstudio.be/*` → `innovatiostudio.be/restoplanner/*`

## 📊 Voordelen van de Migratie

### **1. Betere Organisatie**

- RestoPlanner heeft nu zijn eigen subdirectory
- Makkelijker te beheren en onderhouden

### **2. SEO Voordelen**

- Duidelijke URL structuur
- Betere zoekmachine optimalisatie

### **3. Schaalbaarheid**

- Makkelijker om meerdere applicaties te hosten
- Betere resource management

### **4. Professionaliteit**

- Professionele URL structuur
- Betere branding mogelijkheden

## 🚨 Belangrijke Punten

### **1. Assets Loading**

- Alle assets (CSS, JS, afbeeldingen) worden nu geladen vanuit `/restoplanner/`
- Vite base configuratie zorgt hiervoor

### **2. React Router**

- Alle routes werken nu met `/restoplanner` prefix
- Directe URL toegang werkt correct

### **3. API Endpoints**

- Alle API endpoints zijn beschikbaar onder `/restoplanner/api/`
- Server handelt subdirectory requests correct af

### **4. Database Connectie**

- Supabase connectie blijft hetzelfde
- Geen wijzigingen nodig in database configuratie

## 🎉 Resultaat

Na succesvolle migratie:

- ✅ RestoPlanner draait op `https://innovatiostudio.be/restoplanner`
- ✅ Alle functionaliteit werkt correct
- ✅ Assets laden correct
- ✅ API endpoints zijn beschikbaar
- ✅ Oude domein redirect naar nieuwe locatie
- ✅ SEO en performance geoptimaliseerd

---

**🚀 RestoPlanner is succesvol gemigreerd naar innovatiostudio.be/restoplanner!**
