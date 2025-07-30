# 🚀 Deployment Checklist - RestoPlanner Online

## 📋 **Voorbereiding**

### ✅ **1. Environment Variables**

Maak een `.env` bestand aan op je server met:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU

# Server Configuration
PORT=3001
NODE_ENV=production

# API Configuration
API_BASE_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### ✅ **2. Build de Applicatie**

```bash
npm run build
```

### ✅ **3. Upload Bestanden**

Upload deze bestanden naar je server:

- `dist/` (gebouwde frontend)
- `server.js` (API server)
- `src/api/agendaRoutes.js` (API routes)
- `package.json` (dependencies)
- `.env` (environment variables)

## 🌐 **Deployment Opties**

### **Optie 1: Vercel (Aanbevolen)**

```bash
# Installeer Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Optie 2: Combell VPS**

```bash
# SSH naar je server
ssh user@your-server.com

# Upload bestanden
scp -r dist/ user@your-server.com:/var/www/restoplanner/
scp server.js user@your-server.com:/var/www/restoplanner/
scp package.json user@your-server.com:/var/www/restoplanner/

# Installeer dependencies
cd /var/www/restoplanner
npm install --production

# Start met PM2
pm2 start server.js --name "restoplanner"
pm2 save
pm2 startup
```

### **Optie 3: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY server.js ./
COPY src/api/ ./src/api/
EXPOSE 3001
CMD ["node", "server.js"]
```

## 🔧 **Server Configuratie**

### **Nginx Configuratie**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **SSL Certificaat (Let's Encrypt)**

```bash
sudo certbot --nginx -d your-domain.com
```

## 🧪 **Test Checklist**

### ✅ **Frontend Tests**

- [ ] Website laadt correct
- [ ] Login werkt
- [ ] Floor plan toont correct
- [ ] Reservaties kunnen gemaakt worden

### ✅ **API Tests**

```bash
# Health check
curl https://your-domain.com/health

# API test
curl -X POST https://your-domain.com/api/agenda/check-availability \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id":"test","date":"2024-01-15","time":"19:00","party_size":4}'
```

### ✅ **Make.com Integratie**

- [ ] API endpoints bereikbaar
- [ ] Authenticatie werkt
- [ ] Data wordt correct opgeslagen

## 🔍 **Monitoring**

### **Logs Bekijken**

```bash
# PM2 logs
pm2 logs restoplanner

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Performance Monitoring**

```bash
# Server resources
htop
df -h
free -h

# Node.js process
pm2 monit
```

## 🚨 **Troubleshooting**

### **Veelvoorkomende Problemen**

#### **1. Supabase Connectie Fout**

```bash
# Controleer environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### **2. CORS Errors**

```bash
# Controleer CORS_ORIGIN in .env
echo $CORS_ORIGIN
```

#### **3. Port Niet Beschikbaar**

```bash
# Controleer welke processen poort 3001 gebruiken
lsof -i :3001
```

#### **4. Build Errors**

```bash
# Schone build
rm -rf dist node_modules
npm install
npm run build
```

## 📞 **Support**

### **Combell Support**

- **Email:** support@combell.com
- **Telefoon:** +32 2 259 89 89
- **Chat:** Via Combell dashboard

### **Supabase Support**

- **Documentatie:** https://supabase.com/docs
- **Discord:** https://discord.supabase.com

## ✅ **Deployment Voltooid**

Na deze checklist zou je applicatie volledig online moeten werken met:

- ✅ Frontend op je domain
- ✅ API endpoints beschikbaar
- ✅ Supabase connectie werkend
- ✅ Make.com integratie mogelijk
- ✅ SSL certificaat actief
- ✅ Monitoring ingesteld
