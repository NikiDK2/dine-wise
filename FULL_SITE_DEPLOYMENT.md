# 🌐 Volledige RestoPlanner Site Deployment

## 📋 Overzicht

Deze gids helpt je om de **volledige RestoPlanner website** (frontend + API) online te zetten.

## 🏗️ Architectuur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Database      │
│   (React App)   │◄──►│   (Express)     │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Optie 1: Vercel (Aanbevolen - Gratis)

### **Stap 1: Bereid je project voor**

```bash
# Zorg dat je code klaar is
git add .
git commit -m "Ready for full site deployment"
git push origin main
```

### **Stap 2: Vercel Deployment**

1. **Ga naar [vercel.com](https://vercel.com)**
2. **Import je GitHub repository**
3. **Configureer build settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### **Stap 3: Environment Variables**

Voeg toe in Vercel dashboard:

```
VITE_SUPABASE_URL = jouw_supabase_url
VITE_SUPABASE_ANON_KEY = jouw_supabase_anon_key
```

### **Stap 4: API Routes**

Vercel detecteert automatisch je API routes in `/api` folder.

### **Resultaat:**

- **Frontend:** `https://jouw-project.vercel.app`
- **API:** `https://jouw-project.vercel.app/api/agenda`

## 🏠 Optie 2: Eigen Server (VPS)

### **Stap 1: Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Installeer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installeer Nginx
sudo apt install nginx -y

# Installeer PM2
sudo npm install -g pm2
```

### **Stap 2: Code Deployen**

```bash
# Clone repository
git clone https://github.com/jouw-repo/RestoPlanner2.git
cd RestoPlanner2

# Installeer dependencies
npm install

# Build frontend
npm run build

# Set environment variables
export VITE_SUPABASE_URL="jouw_supabase_url"
export VITE_SUPABASE_ANON_KEY="jouw_supabase_anon_key"

# Start API server
pm2 start server.js --name "restoplanner-api"
pm2 save
pm2 startup
```

### **Stap 3: Nginx Configuratie**

```bash
# Maak Nginx config
sudo nano /etc/nginx/sites-available/restoplanner

# Voeg toe:
server {
    listen 80;
    server_name jouw-domein.com;

    # Frontend (React app)
    location / {
        root /var/www/RestoPlanner2/dist;
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
}

# Enable site
sudo ln -s /etc/nginx/sites-available/restoplanner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Stap 4: SSL Certificaat**

```bash
# Installeer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Krijg SSL certificaat
sudo certbot --nginx -d jouw-domein.com

# Auto-renewal
sudo crontab -e
# Voeg toe: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Optie 3: Docker Deployment

### **Dockerfile voor volledige app**

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy API files
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src/api ./src/api
COPY --from=builder /app/package*.json ./

RUN npm install --production

EXPOSE 3001

CMD ["node", "server.js"]
```

### **Docker Compose**

```yaml
# docker-compose.yml
version: "3.8"

services:
  restoplanner:
    build: .
    ports:
      - "3001:3001"
    environment:
      - VITE_SUPABASE_URL=jouw_supabase_url
      - VITE_SUPABASE_ANON_KEY=jouw_supabase_anon_key
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - restoplanner
    restart: unless-stopped
```

### **Nginx Config voor Docker**

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream restoplanner_backend {
        server restoplanner:3001;
    }

    server {
        listen 80;
        server_name jouw-domein.com;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # API
        location /api/ {
            proxy_pass http://restoplanner_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## 🔧 Alternatieve Platforms

### **Netlify + Functions**

```bash
# Netlify config
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

### **Railway**

```bash
# Railway detecteert automatisch Node.js apps
# Zorg dat package.json een "start" script heeft
```

### **Render**

```bash
# Render config
# render.yaml
services:
  - type: web
    name: restoplanner
    env: node
    buildCommand: npm install && npm run build
    startCommand: node server.js
```

## 📊 Monitoring & Updates

### **Automatische Updates**

```bash
# Deployment script
#!/bin/bash
echo "🚀 Deploying RestoPlanner..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build frontend
npm run build

# Restart API
pm2 restart restoplanner-api

echo "✅ Deployment complete!"
```

### **Health Checks**

```bash
# Frontend health check
curl https://jouw-domein.com

# API health check
curl https://jouw-domein.com/health

# Database connection check
curl https://jouw-domein.com/api/agenda/stats?restaurant_id=test
```

## 🔒 Security

### **Environment Variables**

```bash
# Zorg dat deze NIET in je code staan:
# - Supabase credentials
# - API keys
# - Database passwords
```

### **HTTPS Only**

```nginx
# Force HTTPS
server {
    listen 80;
    server_name jouw-domein.com;
    return 301 https://$server_name$request_uri;
}
```

### **Security Headers**

```nginx
# Add security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 🎉 Resultaat

Na deployment heb je:

- **Frontend:** `https://jouw-domein.com`
- **API:** `https://jouw-domein.com/api/agenda`
- **Database:** Supabase (cloud)

Je volledige RestoPlanner applicatie is nu online! 🚀
