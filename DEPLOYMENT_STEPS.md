# 🚀 RestPlanner Deployment Checklist

## ✅ **Voorbereiding (Klaar!)**

- [x] Code geoptimaliseerd voor subdirectory deployment
- [x] Build script gemaakt
- [x] Deployment package gegenereerd
- [x] Server configuratie aangepast voor /RestPlanner

## 📋 **Stap-voor-Stap Deployment**

### **Stap 1: Combell VPS Voorbereiding**

1. **Log in op je Combell dashboard**
2. **Ga naar je VPS beheer**
3. **Controleer of Node.js 18+ geïnstalleerd is**
4. **Installeer PM2**: `npm install -g pm2`

### **Stap 2: Upload Bestanden**

```bash
# Van je lokale machine:
scp -r deployment/* user@your-server.com:/var/www/innovationstudio.be/RestPlanner/
```

### **Stap 3: Server Setup**

```bash
# SSH naar je server
ssh user@your-server.com

# Ga naar de juiste directory
cd /var/www/innovationstudio.be/RestPlanner

# Installeer dependencies
npm install --production
```

### **Stap 4: Start Applicatie**

```bash
# Start met PM2
pm2 start ecosystem.config.js

# Sla configuratie op
pm2 save
pm2 startup
```

### **Stap 5: Web Server Configuratie**

#### **Voor Apache:**

```bash
# Plaats .htaccess in website root
cp .htaccess /var/www/innovationstudio.be/
```

#### **Voor Nginx:**

```bash
# Kopieer configuratie
sudo cp nginx.conf /etc/nginx/sites-available/innovationstudio.be

# Activeer site
sudo ln -s /etc/nginx/sites-available/innovationstudio.be /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Stap 6: SSL Certificaat**

- Ga naar Combell dashboard
- Activeer SSL certificaat voor innovationstudio.be

### **Stap 7: Test**

1. **API Test**: `curl https://innovationstudio.be/health`
2. **Frontend Test**: Ga naar `https://innovationstudio.be/RestPlanner`

## 🔧 **Monitoring**

```bash
# Bekijk logs
pm2 logs restoplanner

# Monitor status
pm2 monit

# Bekijk processen
pm2 list
```

## 🆘 **Troubleshooting**

### **App start niet**

```bash
# Controleer logs
pm2 logs restoplanner

# Controleer port
lsof -i :3001

# Controleer environment
cat .env
```

### **Static files laden niet**

- Controleer of `dist/` folder correct is geüpload
- Controleer web server configuratie
- Controleer file permissions

### **API routes werken niet**

- Controleer of `src/api/` folder correct is geüpload
- Controleer Supabase connectie
- Controleer CORS configuratie

## 📞 **Support**

- **Combell**: support@combell.com
- **PM2**: https://pm2.keymetrics.io/
- **Nginx**: https://nginx.org/en/docs/

---

## 🎯 **Eindresultaat**

Na deze stappen is je RestPlanner beschikbaar op:
**https://innovationstudio.be/RestPlanner**

### **Beschikbare URLs:**

- 🌐 **Frontend**: https://innovationstudio.be/RestPlanner
- 🔌 **API Health**: https://innovationstudio.be/health
- 📡 **API Endpoints**: https://innovationstudio.be/api/agenda/*
- 🏥 **Health Check**: https://innovationstudio.be/api/health
