# ✅ RestoPlanner Migratie Checklist

## 🎯 Van innovationstudio.be naar innovatiostudio.be/restoplanner

### 📋 Pre-Deployment Checklist

- [ ] **Code wijzigingen zijn gemaakt:**

  - [ ] `vite.config.ts` - `base: "/restoplanner/"`
  - [ ] `src/App.tsx` - `basename="/restoplanner"`
  - [ ] `server-minimal.js` - `/restoplanner` handling
  - [ ] `INNOVATIOSTUDIO_DEPLOYMENT.md` - nieuwe deployment gids
  - [ ] `redirect-old-domain.html` - redirect pagina

- [ ] **Git repository is up-to-date:**
  - [ ] Alle wijzigingen zijn gecommit
  - [ ] Code is gepusht naar GitHub
  - [ ] Branch is `main`

### 🚀 Deployment Stappen

#### **Stap 1: Nieuwe Combell Instance**

- [ ] Log in op Combell dashboard
- [ ] Ga naar Node.js sectie
- [ ] Klik "Add instance" of "Nieuwe Node.js instance"
- [ ] Configureer:
  - [ ] Git Repository: `https://github.com/NikiDK2/dine-wise.git`
  - [ ] Branch: `main`
  - [ ] Build Command: `npm run build`
  - [ ] Serve Command: `npm run serve`
  - [ ] Base Path: `/restoplanner`
  - [ ] Domain: `innovatiostudio.be`

#### **Stap 2: Environment Variables**

- [ ] Voeg toe in Combell dashboard:
  ```env
  NODE_ENV=production
  VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
  PORT=3001
  API_BASE_URL=https://innovatiostudio.be
  CORS_ORIGIN=https://innovatiostudio.be
  BASE_PATH=/restoplanner
  ```

#### **Stap 3: Domain Configuratie**

- [ ] Ga naar "Websites & SSL"
- [ ] Voeg `innovatiostudio.be` toe aan Node.js instance
- [ ] Activeer SSL certificaat voor `innovatiostudio.be`

#### **Stap 4: Deploy**

- [ ] Klik "Deploy" in Combell dashboard
- [ ] Wacht tot build succesvol is
- [ ] Controleer of app start zonder errors

### 🧪 Testing Checklist

#### **Frontend Testing**

- [ ] **Homepage laadt:** `https://innovatiostudio.be/restoplanner`
- [ ] **React Router werkt:** Navigatie tussen pagina's
- [ ] **Assets laden:** CSS, JS, afbeeldingen
- [ ] **Responsive design:** Werkt op mobile/desktop

#### **API Testing**

- [ ] **Health check:** `https://innovatiostudio.be/restoplanner/health`
- [ ] **Agenda API:** `https://innovatiostudio.be/restoplanner/api/agenda/health`
- [ ] **Reservations API:** `https://innovatiostudio.be/restoplanner/api/reservations/check-availability`

#### **Database Testing**

- [ ] **Supabase connectie:** App kan data ophalen
- [ ] **Reservations:** Nieuwe reserveringen kunnen worden aangemaakt
- [ ] **Restaurant data:** Restaurant instellingen laden

### 🔄 Oude Domein Afhandeling

#### **Option A: Redirect (Aanbevolen)**

- [ ] Upload `redirect-old-domain.html` naar `innovationstudio.be`
- [ ] Test redirect: `innovationstudio.be` → `innovatiostudio.be/restoplanner`
- [ ] Controleer of alle oude links werken

#### **Option B: DNS Redirect**

- [ ] Configureer DNS redirect in Combell
- [ ] `innovationstudio.be/*` → `innovatiostudio.be/restoplanner/*`

### 📊 Post-Deployment Monitoring

#### **Performance Monitoring**

- [ ] **Page load times:** < 3 seconden
- [ ] **API response times:** < 1 seconde
- [ ] **Error rates:** < 1%
- [ ] **Uptime:** > 99.9%

#### **User Experience**

- [ ] **Mobile responsive:** Werkt op alle devices
- [ ] **Browser compatibility:** Chrome, Firefox, Safari, Edge
- [ ] **Accessibility:** Screen readers, keyboard navigation

### 🛠️ Troubleshooting

#### **Common Issues**

- [ ] **404 errors:** Controleer base path configuratie
- [ ] **Static files not loading:** Controleer Vite base URL
- [ ] **React Router not working:** Controleer basename
- [ ] **API errors:** Controleer environment variables

#### **Debug Steps**

- [ ] Check Combell logs voor errors
- [ ] Test API endpoints direct
- [ ] Controleer browser console voor errors
- [ ] Verify Supabase connection

### 🎉 Final Steps

#### **Verificatie**

- [ ] **Alles werkt:** Frontend + Backend + Database
- [ ] **Performance OK:** Geen performance issues
- **Security OK:** SSL certificaat actief
- [ ] **SEO OK:** Meta tags, sitemap

#### **Documentatie**

- [ ] **Update README:** Nieuwe URL vermelden
- [ ] **Update API docs:** Nieuwe endpoints
- [ ] **Update Make.com:** Nieuwe API URL's

#### **Communicatie**

- [ ] **Informeer gebruikers:** Over nieuwe URL
- [ ] **Update bookmarks:** In browser
- [ ] **Update links:** Op social media, websites

### ✅ Success Criteria

- [ ] **Nieuwe URL werkt:** `https://innovatiostudio.be/restoplanner`
- [ ] **Alle functionaliteit:** Reservations, agenda, etc.
- [ ] **Performance:** Snelle laadtijden
- [ ] **SEO:** Geen broken links
- [ ] **User experience:** Soepel gebruik

---

**🎉 Migratie succesvol wanneer alle items zijn afgevinkt!**
