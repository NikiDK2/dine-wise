# 🏢 Combell VPS Deployment Guide

## 📋 Voorbereiding

### **1. Combell VPS Aanmaken**

1. **Log in op Combell dashboard**
2. **Ga naar VPS sectie**
3. **Kies VPS plan:**
   - **VPS Basic:** €15/maand (2GB RAM, 1 CPU)
   - **VPS Standard:** €25/maand (4GB RAM, 2 CPU)
   - **VPS Professional:** €35/maand (8GB RAM, 4 CPU)
4. **Kies OS:** Ubuntu 22.04 LTS
5. **Configureer root password**

### **2. Server Toegang**

```bash
# SSH naar je VPS
ssh root@jouw-vps-ip

# Update system
apt update && apt upgrade -y
```

## 🚀 Stap-voor-Stap Deployment

### **Stap 1: Basis Software Installeren**

```bash
# Installeer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Controleer versie
node --version
npm --version

# Installeer PM2 (process manager)
npm install -g pm2

# Installeer Nginx
apt install nginx -y

# Installeer Git
apt install git -y
```

### **Stap 2: Domein Configureren**

```bash
# Ga naar Combell dashboard
# DNS Management → Voeg A record toe:
# Name: @ (of subdomein)
# Value: jouw-vps-ip
# TTL: 300
```

### **Stap 3: Code Deployen**

```bash
# Maak directory
mkdir -p /var/www/restoplanner
cd /var/www/restoplanner

# Clone repository
git clone https://github.com/jouw-repo/RestoPlanner2.git .
# OF upload files via FTP/SFTP

# Installeer dependencies
npm install

# Build frontend
npm run build

# Set environment variables
export VITE_SUPABASE_URL="jouw_supabase_url"
export VITE_SUPABASE_ANON_KEY="jouw_supabase_anon_key"

# Test API server
node server.js
# Druk Ctrl+C om te stoppen
```

### **Stap 4: PM2 Process Manager**

```bash
# Start API server met PM2
pm2 start server.js --name "restoplanner-api"

# Save PM2 config
pm2 save
pm2 startup

# Controleer status
pm2 status
pm2 logs restoplanner-api
```

### **Stap 5: Nginx Configuratie**

```bash
# Maak Nginx config
nano /etc/nginx/sites-available/restoplanner

# Voeg toe:
server {
    listen 80;
    server_name jouw-domein.com www.jouw-domein.com;

    # Frontend (React app)
    location / {
        root /var/www/restoplanner/dist;
        try_files $uri $uri/ /index.html;

        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api/ {
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

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}

# Enable site
ln -s /etc/nginx/sites-available/restoplanner /etc/nginx/sites-enabled/

# Test configuratie
nginx -t

# Reload Nginx
systemctl reload nginx
```

### **Stap 6: SSL Certificaat (Let's Encrypt)**

```bash
# Installeer Certbot
apt install certbot python3-certbot-nginx -y

# Krijg SSL certificaat
certbot --nginx -d jouw-domein.com -d www.jouw-domein.com

# Auto-renewal
crontab -e
# Voeg toe: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Stap 7: Firewall Configuratie**

```bash
# Installeer UFW
apt install ufw -y

# Configureer firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable

# Controleer status
ufw status
```

## 🔧 Alternatieve Methoden

### **Option A: Combell Shared Hosting**

Als je shared hosting hebt:

1. **Upload files via FTP**
2. **Configureer .htaccess voor Node.js**
3. **Set environment variables in cPanel**

### **Option B: Docker op Combell VPS**

```bash
# Installeer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Maak Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "server.js"]
EOF

# Build en run
docker build -t restoplanner .
docker run -d -p 3001:3001 --name restoplanner-app restoplanner
```

## 📊 Monitoring & Onderhoud

### **PM2 Monitoring**

```bash
# Bekijk logs
pm2 logs restoplanner-api

# Monitor processen
pm2 monit

# Restart service
pm2 restart restoplanner-api

# Update code
cd /var/www/restoplanner
git pull origin main
npm install
npm run build
pm2 restart restoplanner-api
```

### **Nginx Logs**

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### **Server Monitoring**

```bash
# Systeem resources
htop
df -h
free -h

# Processen
ps aux | grep node
ps aux | grep nginx
```

## 🔒 Security Best Practices

### **1. Regular Updates**

```bash
# System updates
apt update && apt upgrade -y

# Node.js updates
npm update -g

# PM2 updates
npm update -g pm2
```

### **2. Backup Strategy**

```bash
# Maak backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/restoplanner"

mkdir -p $BACKUP_DIR

# Backup code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/restoplanner

# Backup PM2 config
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_$DATE.pm2

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.pm2" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup.sh

# Voeg toe aan crontab (dagelijks om 2:00)
crontab -e
# Voeg toe: 0 2 * * * /root/backup.sh
```

### **3. Fail2ban (DDoS Protection)**

```bash
# Installeer Fail2ban
apt install fail2ban -y

# Configureer
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Start service
systemctl enable fail2ban
systemctl start fail2ban
```

## 🎉 Resultaat

Na deployment heb je:

- **Frontend:** `https://jouw-domein.com`
- **API:** `https://jouw-domein.com/api/agenda`
- **Database:** Supabase (cloud)
- **SSL:** Automatisch vernieuwd
- **Monitoring:** PM2 + Nginx logs
- **Backups:** Dagelijks automatisch

## 📞 Combell Support

### **Contactgegevens:**

- **Telefoon:** 02 201 11 11
- **Email:** support@combell.com
- **Live chat:** Via Combell dashboard

### **Hulp bij problemen:**

1. **Controleer Combell status page**
2. **Bekijk server logs**
3. **Contacteer Combell support**
4. **Check firewall settings**

Je RestoPlanner applicatie draait nu op je eigen Combell server! 🚀
