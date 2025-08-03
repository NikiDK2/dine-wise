#!/bin/bash

# Combell Deployment Script
echo "🚀 Combell Deployment voor RestoPlanner2"

# Environment variabelen
export NODE_ENV=production
export PORT=3001
# Supabase Configuration - Vervang met jouw eigen waarden
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
export RESTAURANT_ID=your-restaurant-uuid
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
export API_BASE_URL=https://innovationstudio.be
export CORS_ORIGIN=https://innovationstudio.be

echo "📦 Install dependencies..."
npm install

echo "🔨 Build applicatie..."
npm run build

echo "✅ Build voltooid!"
echo "🌐 Applicatie klaar voor Combell deployment"
echo "📡 Health check: https://innovationstudio.be/health"
echo "🎯 Frontend: https://innovationstudio.be/RestPlanner" 