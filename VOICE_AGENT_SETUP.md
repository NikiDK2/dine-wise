# 🎤 ElevenLabs Voice Agent Setup

## 📋 Overzicht

Deze handleiding legt uit hoe je de ElevenLabs voice agent functionaliteit kunt opzetten zodat de agent daadwerkelijk klanten kan opbellen.

## 🔧 Vereisten

### 1. ElevenLabs Account

- Maak een account aan op [ElevenLabs.io](https://elevenlabs.io)
- Upgrade naar betaalde plan voor Conversational AI
- Genereer API key
- **Optioneel:** Koppel je Twilio account voor outbound calls
- **Nieuw:** ElevenLabs Conversational AI 2.0 ondersteuning

### 2. Environment Variabelen

Voeg deze variabelen toe aan je `.env` bestand:

```env
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id

# Twilio Configuration (optioneel voor outbound calls)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+32 800 42 016
```

## 🚀 Stappen om de Voice Agent te Activeren

### Stap 1: API Key Configureren

1. Ga naar je ElevenLabs dashboard
2. Kopieer je API key
3. Voeg deze toe aan je `.env` bestand

### Stap 2: Test de Voice Agent

```bash
# Test de voice agent aanmaken
curl -X POST http://localhost:3001/api/voice-call \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Niki De Kimpe",
    "customer_phone": "+32479397818"
  }'
```

### Stap 3: Test de Daadwerkelijke Oproep

```bash
# Test de volledige workflow (agent maken + oproep)
curl -X POST http://localhost:3001/api/voice-agent/complete-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Niki De Kimpe",
    "customer_phone": "+32479397818"
  }'
```

## 📡 API Endpoints

### 1. Voice Agent Aanmaken

```
POST /api/voice-call
```

**Request:**

```json
{
  "customer_name": "Niki De Kimpe",
  "customer_phone": "+32479397818"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Voice agent aangemaakt voor Niki",
  "customer_name": "Niki",
  "customer_phone": "+32479397818",
  "agent_id": "agent_1754470551598",
  "fileSize": 327,
  "call_type": "outside_hours_notification",
  "language": "nl",
  "voice_model": "eleven_turbo_v2_5",
  "voice_id": "ANHrhmaFeVN0QJaa0PhL",
  "status": "ready",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### 2. Voice Agent Data Loggen

```
POST /api/voice-agent/log
```

**Request:**

```json
{
  "agent_id": "agent_1754470551598",
  "customer_name": "Niki",
  "customer_phone": "+32479397818",
  "fileSize": 327,
  "call_type": "outside_hours_notification",
  "language": "nl",
  "voice_model": "eleven_turbo_v2_5",
  "voice_id": "ANHrhmaFeVN0QJaa0PhL",
  "status": "ready",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### 3. Daadwerkelijke Oproep Initiëren

```
POST /api/voice-agent/call
```

**Request:**

```json
{
  "agent_id": "agent_1754470551598",
  "customer_name": "Niki",
  "customer_phone": "+32479397818"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Oproep geïnitieerd voor Niki",
  "customer_name": "Niki",
  "customer_phone": "+32479397818",
  "agent_id": "agent_1754470551598",
  "call_id": "call_123456789",
  "signed_url": "https://api.elevenlabs.io/v1/convai/agents/...",
  "call_status": "initiated",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Volledige Workflow

```
POST /api/voice-agent/complete-workflow
```

**Request:**

```json
{
  "customer_name": "Niki De Kimpe",
  "customer_phone": "+32479397818"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Volledige voice agent workflow voltooid voor Niki De Kimpe",
  "workflow_steps": {
    "step1_agent_created": true,
    "step2_data_logged": true,
    "step3_call_initiated": true
  },
  "agent_data": { ... },
  "call_data": { ... },
  "customer_name": "Niki De Kimpe",
  "customer_phone": "+32479397818",
  "agent_id": "agent_1754470551598",
  "call_id": "call_123456789",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. WebSocket Verbinding

```
POST /api/voice-agent/websocket
```

**Request:**

```json
{
  "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp",
  "customer_name": "Niki",
  "customer_phone": "+32479397818",
  "websocket_url": "wss://api.elevenlabs.io/v1/convai/conversation?..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "WebSocket verbinding klaar voor Niki",
  "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp",
  "customer_name": "Niki",
  "customer_phone": "+32479397818",
  "websocket_url": "wss://api.elevenlabs.io/v1/convai/conversation?...",
  "connection_instructions": {
    "step1": "Maak WebSocket verbinding met de websocket_url",
    "step2": "Stuur conversation_initiation_client_data bericht",
    "step3": "Luister naar agent responses",
    "step4": "Stuur user audio data",
    "step5": "Sluit verbinding na gesprek"
  },
  "sample_messages": {
    "initiation": {
      "type": "conversation_initiation_client_data",
      "dynamic_variables": {
        "customer_name": "Niki",
        "phone_number": "+32479397818"
      }
    },
    "audio_data": {
      "type": "audio_data",
      "audio": "base64_encoded_audio_data",
      "encoding": "base64"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 6. Twilio Outbound Call

```
POST /api/voice-agent/twilio-call
```

**Request:**

```json
{
  "customer_name": "Niki De Kimpe",
  "customer_phone": "+32479397818",
  "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Twilio call geïnitieerd voor Niki De Kimpe",
  "customer_name": "Niki De Kimpe",
  "customer_phone": "+32479397818",
  "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp",
  "twilio_config": {
    "account_sid": "YOUR_TWILIO_ACCOUNT_SID",
    "auth_token": "YOUR_TWILIO_AUTH_TOKEN",
    "from_number": "+32 800 42 016",
    "to_number": "+32479397818"
  },
  "call_instructions": {
    "step1": "Gebruik Twilio API om outbound call te maken",
    "step2": "Koppel met ElevenLabs agent voor voice",
    "step3": "Start het gesprek"
  },
  "api_endpoint": "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Calls.json",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔍 Troubleshooting

### Probleem: "ElevenLabs API key niet geconfigureerd"

**Oplossing:** Voeg `ELEVENLABS_API_KEY` toe aan je `.env` bestand

### Probleem: "Kon geen signed URL maken"

**Oplossing:**

- Controleer of je API key geldig is
- Controleer of je voldoende credits hebt
- Controleer of het telefoonnummer correct is geformatteerd (+32...)

### Probleem: "Oproep kon niet worden geïnitieerd"

**Oplossing:**

- Controleer of het telefoonnummer geldig is
- Controleer of je voldoende credits hebt voor outbound calls
- Controleer of de agent correct is aangemaakt

## 💰 Kosten

- **Agent aanmaken:** Gratis
- **Outbound calls:** Betaald per minuut
- **Voice credits:** Vereist voor TTS (Text-to-Speech)

## 🎯 Gebruik in de Applicatie

### Automatische Oproepen bij Buiten Openingstijden

Wanneer een klant een reservering aanvraagt buiten de openingstijden:

1. **Trigger:** Reservering buiten openingstijden
2. **Action:** Voice agent workflow starten
3. **Result:** Klant wordt automatisch opgebeld

### Voorbeeld Implementatie

```javascript
// In je reservering logica
if (isOutsideOpeningHours) {
  // Start voice agent workflow
  const response = await fetch("/api/voice-agent/complete-workflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: customerName,
      customer_phone: customerPhone,
    }),
  });

  const result = await response.json();
  console.log("Voice agent workflow gestart:", result);
}
```

## 📞 Voice Agent Script

De voice agent gebruikt dit script:

```
"Hallo [klantnaam]! Je spreekt met de klantenservice van ons restaurant.
Ik zie dat je een reservering hebt aangevraagd buiten onze openingstijden.
Laat me je helpen met een alternatieve tijd."
```

## 🎙️ Voice Instellingen

- **Voice:** Standaard voice (21m00Tcm4TlvDq8ikWAM)
- **Model:** Eleven Turbo v2.5
- **Taal:** Nederlands
- **Stability:** 0.8
- **Similarity Boost:** 0.7
- **Style:** 0.5
- **Speaker Boost:** true

## 🚀 ElevenLabs Conversational AI 2.0 Features

### Nieuwe Features (2025)

- **Verbeterde natuurlijke turn-taking**
- **Multimodale ondersteuning**
- **HIPAA compliance opties**
- **Auto language detection**
- **High-quality ASR (Automatic Speech Recognition)**

### Ondersteunde LLM Modellen

- **gemini-2.0-flash** (standaard, beste prestatie)
- **gpt-4.1**, **gpt-4.1-mini**, **gpt-4.1-nano**
- **claude-3.5-sonnet**, **claude-3.5-haiku**

### Concurrency Limits

- **Free:** 2 gelijktijdige requests
- **Creator:** 5 gelijktijdige requests
- **Pro:** 10 gelijktijdige requests
- **Business:** 15 gelijktijdige requests

## ✅ Checklist

- [ ] ElevenLabs account aangemaakt
- [ ] API key geconfigureerd in `.env`
- [ ] Credits gekocht voor outbound calls
- [ ] Voice agent getest met `/api/voice-call`
- [ ] Daadwerkelijke oproep getest met `/api/voice-agent/call`
- [ ] Volledige workflow getest met `/api/voice-agent/complete-workflow`
- [ ] Integratie toegevoegd aan reservering logica

## 🚨 Belangrijke Notities

1. **Telefoonnummers** moeten in internationaal formaat zijn (+32...)
2. **Credits** zijn vereist voor outbound calls
3. **Test** eerst met je eigen telefoonnummer
4. **Monitor** de console logs voor debugging
5. **Backup** plan voor als ElevenLabs niet beschikbaar is

## 🔗 Make.com Integratie

### HTTP Module Configuratie

Voor Make.com integratie gebruik je:

- **"Make an API Key Auth Request"** (aanbevolen)
- **Header naam:** `xi-api-key` (niet `Authorization`)
- **Base URL:** `https://api.elevenlabs.io/v1/convai/`

### Voorbeeld Make.com Workflow

1. **Trigger:** Reservering buiten openingstijden
2. **HTTP Request:** Agent aanmaken
3. **HTTP Request:** Signed URL ophalen
4. **WebSocket:** Verbinding maken
5. **Action:** Voice call starten

### Make.com HTTP Module Instellingen

```
URL: https://api.elevenlabs.io/v1/convai/agents/create
Method: POST
Headers:
  - Content-Type: application/json
  - xi-api-key: {{connection.api_key}}
Body (Raw JSON):
{
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "Je bent een vriendelijke Nederlandse klantenservice medewerker...",
        "llm": "gemini-2.0-flash"
      },
      "first_message": "Hallo! Je spreekt met de klantenservice...",
      "language": "nl"
    },
    "tts": {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "model": "eleven_turbo_v2_5",
      "language": "nl"
    }
  },
  "name": "Klantenservice Agent"
}
```
