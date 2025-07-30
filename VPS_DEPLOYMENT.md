# 🖥️ VPS Deployment Guide

## 📋 Voorbereiding

### **1. VPS Aanmaken**

- **Linode:** $5/maand (1GB RAM)
- **DigitalOcean:** $5/maand (1GB RAM)
- **Vultr:** $2.50/maand (512MB RAM)
- **OVH:** €3.50/maand (2GB RAM)

### **2. Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Installeer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installeer PM2 (process manager)
sudo npm install -g pm2

# Installeer Nginx (reverse proxy)
sudo apt install nginx -y
```

### **3. Code Deployen**

```bash
# Clone repository
git clone https://github.com/jouw-repo/RestoPlanner2.git
cd RestoPlanner2

# Installeer dependencies
npm install

# Set environment variables
export VITE_SUPABASE_URL="jouw_supabase_url"
export VITE_SUPABASE_ANON_KEY="jouw_supabase_anon_key"

# Start met PM2
pm2 start server.js --name "restoplanner-api"

# Save PM2 config
pm2 save
pm2 startup
```

### **4. Nginx Configuratie**

```bash
# Maak Nginx config
sudo nano /etc/nginx/sites-available/restoplanner-api

# Voeg toe:
server {
    listen 80;
    server_name jouw-domein.com;

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

# Enable site
sudo ln -s /etc/nginx/sites-available/restoplanner-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **5. SSL Certificaat (Let's Encrypt)**

```bash
# Installeer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Krijg SSL certificaat
sudo certbot --nginx -d jouw-domein.com

# Auto-renewal
sudo crontab -e
# Voeg toe: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Alternatieve Deployment Methoden

### **Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
# Build en run
docker build -t restoplanner-api .
docker run -d -p 3001:3001 --name restoplanner-api restoplanner-api
```

### **Systemd Service**

```bash
# Maak service file
sudo nano /etc/systemd/system/restoplanner-api.service

# Voeg toe:
[Unit]
Description=RestoPlanner API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/restoplanner-api
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=VITE_SUPABASE_URL=jouw_supabase_url
Environment=VITE_SUPABASE_ANON_KEY=jouw_supabase_anon_key

[Install]
WantedBy=multi-user.target

# Enable en start service
sudo systemctl enable restoplanner-api
sudo systemctl start restoplanner-api
```

## 📊 Monitoring & Logs

### **PM2 Monitoring**

```bash
# Bekijk logs
pm2 logs restoplanner-api

# Monitor processen
pm2 monit

# Restart service
pm2 restart restoplanner-api
```

### **Nginx Logs**

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security

### **Firewall Setup**

```bash
# Installeer UFW
sudo apt install ufw -y

# Configureer firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### **Fail2ban (DDoS Protection)**

```bash
# Installeer Fail2ban
sudo apt install fail2ban -y

# Configureer
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 🚀 Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying RestoPlanner API..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Set environment variables
export VITE_SUPABASE_URL="jouw_supabase_url"
export VITE_SUPABASE_ANON_KEY="jouw_supabase_anon_key"

# Restart PM2 process
pm2 restart restoplanner-api

echo "✅ Deployment complete!"
```

## 📈 Scaling

### **Load Balancer**

```bash
# Met Nginx
upstream restoplanner_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

### **Database Scaling**

- **Supabase** schaalt automatisch
- **Of gebruik eigen PostgreSQL** server

## 🎉 Resultaat

Na deployment is je API beschikbaar op:

```
https://jouw-domein.com/api/agenda
```

Je kunt nu externe programma's verbinden met je API! 🚀
