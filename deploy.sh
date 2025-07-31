#!/bin/bash

# RestPlanner Deployment Script voor Combell VPS
# Gebruik: ./deploy.sh

echo "🚀 RestPlanner Deployment naar innovationstudio.be/RestPlanner"
echo "================================================================"

# 1. Build de applicatie
echo "📦 Building applicatie..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build gefaald!"
    exit 1
fi

echo "✅ Build succesvol!"

# 2. Maak deployment package
echo "📁 Maken deployment package..."
mkdir -p deployment
cp -r dist deployment/
cp server.js deployment/
cp package.json deployment/
cp -r src/api deployment/src/
cp .htaccess deployment/

# 3. Maak een .env bestand voor productie
echo "🔧 Maken .env bestand..."
cat > deployment/.env << EOF
NODE_ENV=production
VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
PORT=3001
API_BASE_URL=https://innovationstudio.be
CORS_ORIGIN=https://innovationstudio.be
EOF

# 4. Maak een start script
echo "🎯 Maken start script..."
cat > deployment/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting RestPlanner..."
export NODE_ENV=production
npm install --production
node server.js
EOF

chmod +x deployment/start.sh

# 5. Maak een PM2 configuratie
echo "⚙️ Maken PM2 configuratie..."
cat > deployment/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'restoplanner',
    script: 'server.js',
    cwd: '/var/www/innovationstudio.be/RestPlanner',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

echo "✅ Deployment package gemaakt in 'deployment/' folder"
echo ""
echo "📋 Volgende stappen:"
echo "1. Upload de 'deployment/' folder naar je Combell VPS"
echo "2. Plaats de bestanden in /var/www/innovationstudio.be/RestPlanner/"
echo "3. Installeer dependencies: npm install --production"
echo "4. Start met PM2: pm2 start ecosystem.config.js"
echo "5. Configureer Nginx/Apache voor /RestPlanner routing"
echo ""
echo "🌐 Je app zal beschikbaar zijn op: https://innovationstudio.be/RestPlanner" 