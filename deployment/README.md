# 🚀 RestPlanner Deployment naar innovationstudio.be/RestPlanner

## 📋 Deployment Instructies

### Stap 1: Upload naar Combell VPS

1. **Upload bestanden**

   ```bash
   # Upload de hele deployment folder naar je VPS
   scp -r deployment/* user@your-server.com:/var/www/innovationstudio.be/RestPlanner/
   ```

2. **SSH naar je server**
   ```bash
   ssh user@your-server.com
   ```

### Stap 2: Server Setup

1. **Ga naar de juiste directory**

   ```bash
   cd /var/www/innovationstudio.be/RestPlanner
   ```

2. **Installeer dependencies**

   ```bash
   npm install --production
   ```

3. **Installeer PM2 (als nog niet geïnstalleerd)**
   ```bash
   npm install -g pm2
   ```

### Stap 3: Start de Applicatie

1. **Start met PM2**

   ```bash
   pm2 start ecosystem.config.js
   ```

2. **Sla PM2 configuratie op**
   ```bash
   pm2 save
   pm2 startup
   ```

### Stap 4: Web Server Configuratie

#### Voor Apache:

1. **Plaats .htaccess in de root van je website**
   ```bash
   cp .htaccess /var/www/innovationstudio.be/
   ```

#### Voor Nginx:

1. **Kopieer nginx.conf naar sites-available**

   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/innovationstudio.be
   ```

2. **Activeer de site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/innovationstudio.be /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Stap 5: SSL Certificaat

Combell biedt gratis SSL certificaten aan. Activeer dit via je Combell dashboard.

### Stap 6: Test de Applicatie

1. **Test de API**

   ```bash
   curl https://innovationstudio.be/health
   curl https://innovationstudio.be/api/health
   ```

2. **Test de frontend**
   - Ga naar: https://innovationstudio.be/RestPlanner
   - Test alle functionaliteiten

### Stap 7: Monitoring

1. **Bekijk logs**

   ```bash
   pm2 logs restoplanner
   ```

2. **Monitor status**
   ```bash
   pm2 monit
   ```

## 🔧 Troubleshooting

### App start niet

- Controleer logs: `pm2 logs restoplanner`
- Controleer port: `lsof -i :3001`
- Controleer environment variables

### Static files laden niet

- Controleer of dist folder correct is geüpload
- Controleer web server configuratie
- Controleer file permissions

### API routes werken niet

- Controleer of agendaRoutes correct is geüpload
- Controleer Supabase connectie
- Controleer CORS configuratie

## 📞 Support

- **Combell Support**: support@combell.com
- **PM2 Documentatie**: https://pm2.keymetrics.io/
- **Nginx Documentatie**: https://nginx.org/en/docs/

---

**🎉 Je RestPlanner is nu live op https://innovationstudio.be/RestPlanner !**
