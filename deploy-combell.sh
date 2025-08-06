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

# ElevenLabs Voice Agent Configuration
export ELEVENLABS_API_KEY=sk_e24eb242f160711fa44cd1b0d713d01bcd9fa7ffe47031a2
export ELEVENLABS_AGENT_ID=agent_2801k1xa860xfwvbp0htwphv43dp

# Twilio Configuration
export TWILIO_ACCOUNT_SID=your-twilio-account-sid
export TWILIO_AUTH_TOKEN=your-twilio-auth-token
export TWILIO_PHONE_NUMBER="+32 800 42 016"

echo "📦 Install dependencies..."
npm install

echo "🔨 Build applicatie..."
npm run build

echo "📁 Kopieer server file..."
cp server-combell-voice-agent.js ./server-combell-voice-agent.js

echo "✅ Build voltooid!"
echo "🌐 Applicatie klaar voor Combell deployment"
echo "📡 Health check: https://innovationstudio.be/health"
echo "🎯 Frontend: https://innovationstudio.be/RestPlanner"
echo "📞 Voice Agent: https://innovationstudio.be/api/voice-call" 