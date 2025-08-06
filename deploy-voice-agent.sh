#!/bin/bash

# Voice Agent Deployment Script
echo "🎤 Voice Agent Deployment voor RestoPlanner2"

# Environment variabelen - Forceer echte configuratie
export NODE_ENV=production
export PORT=3001

# Supabase Configuration
export VITE_SUPABASE_URL=https://uhrwgjwgdgpgrzbdodgr.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocndnandnZGdwZ3J6YmRvZGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDk1MDgsImV4cCI6MjA2OTE4NTUwOH0.GrgI-4xwg66tfBBNIjkil5nNEqawiPHMBcBRETM1sBU
export SUPABASE_SERVICE_ROLE_KEY=sb_secret_KLpT35vdk51lib-LeKW8iw_splqhZW-
export RESTAURANT_ID=123

# API Configuration
export API_BASE_URL=https://innovationstudio.be
export CORS_ORIGIN=https://innovationstudio.be

# ElevenLabs Voice Agent Configuration - ECHTE CONFIGURATIE
export ELEVENLABS_API_KEY=sk_e24eb242f160711fa44cd1b0d713d01bcd9fa7ffe47031a2
export ELEVENLABS_AGENT_ID=agent_2801k1xa860xfwvbp0htwphv43dp

# Twilio Configuration - ECHTE CONFIGURATIE
export TWILIO_ACCOUNT_SID=your-twilio-account-sid
export TWILIO_AUTH_TOKEN=your-twilio-auth-token
export TWILIO_PHONE_NUMBER="+32 800 42 016"

echo "📦 Install dependencies..."
npm install

echo "🔨 Build applicatie..."
npm run build

echo "🎤 Voice Agent Configuratie:"
echo "   - ElevenLabs Agent ID: $ELEVENLABS_AGENT_ID"
echo "   - ElevenLabs API Key: $ELEVENLABS_API_KEY"
echo "   - Twilio Account SID: $TWILIO_ACCOUNT_SID"
echo "   - Twilio Phone Number: $TWILIO_PHONE_NUMBER"

echo "✅ Build voltooid!"
echo "🌐 Applicatie klaar voor deployment"
echo "📡 Health check: https://innovationstudio.be/api/health"
echo "🎤 Voice Agent: https://innovationstudio.be/api/voice-call"
echo "📞 Twilio Call: https://innovationstudio.be/api/voice-agent/twilio-call"
echo "🎯 Frontend: https://innovationstudio.be/RestPlanner"

echo "🚀 Deploy naar Combell..."
echo "   - Run pipeline in Combell dashboard"
echo "   - Wacht tot deployment voltooid is"
echo "   - Test de voice agent endpoints"

echo "🧪 Test Commands:"
echo "curl -X POST https://innovationstudio.be/api/voice-call \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"customer_name\": \"Niki\", \"customer_phone\": \"+32479397818\"}'" 