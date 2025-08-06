# 🎤 Make.com Voice Agent Integratie

## 📋 Overzicht

Deze gids toont je hoe je de RestoPlanner voice agent integreert in Make.com voor automatische voice calls wanneer klanten reserveringen aanvragen buiten de openingstijden.

## 🌐 Online API Endpoints

De voice agent API is beschikbaar op: `https://innovationstudio.be/api/`

### Beschikbare Endpoints

1. **Voice Agent Aanmaken:** `POST /api/voice-call`
2. **Twilio Outbound Call:** `POST /api/voice-agent/twilio-call`
3. **Volledige Workflow:** `POST /api/voice-agent/complete-workflow`
4. **WebSocket Verbinding:** `POST /api/voice-agent/websocket`
5. **Voice Agent Logging:** `POST /api/voice-agent/log`

## 🔧 Make.com HTTP Module Configuratie

### Stap 1: HTTP Module Toevoegen

1. Ga naar je Make.com scenario
2. Klik op **"Add a module"**
3. Zoek naar **"HTTP"**
4. Selecteer **"Make an HTTP request"**

### Stap 2: Voice Agent Aanmaken

**Module Configuratie:**

```
URL: https://innovationstudio.be/api/voice-call
Method: POST
Headers:
  Content-Type: application/json
```

**Body (Raw JSON):**

```json
{
  "customer_name": "{{customer_name}}",
  "customer_phone": "{{customer_phone}}"
}
```

**Response Mapping:**

```json
{
  "success": "{{success}}",
  "agent_id": "{{agent_id}}",
  "customer_name": "{{customer_name}}",
  "customer_phone": "{{customer_phone}}",
  "status": "{{status}}",
  "twilio_phone": "{{twilio_phone}}"
}
```

### Stap 3: Twilio Outbound Call

**Module Configuratie:**

```
URL: https://innovationstudio.be/api/voice-agent/twilio-call
Method: POST
Headers:
  Content-Type: application/json
```

**Body (Raw JSON):**

```json
{
  "customer_name": "{{customer_name}}",
  "customer_phone": "{{customer_phone}}",
  "agent_id": "{{agent_id}}"
}
```

**Response Mapping:**

```json
{
  "success": "{{success}}",
  "call_id": "{{call_id}}",
  "twilio_config": {
    "from_number": "{{from_number}}",
    "to_number": "{{to_number}}"
  }
}
```

### Stap 4: Volledige Workflow

**Module Configuratie:**

```
URL: https://innovationstudio.be/api/voice-agent/complete-workflow
Method: POST
Headers:
  Content-Type: application/json
```

**Body (Raw JSON):**

```json
{
  "customer_name": "{{customer_name}}",
  "customer_phone": "{{customer_phone}}"
}
```

## 🎯 Praktische Use Cases

### Use Case 1: Automatische Voice Call bij Buiten Openingstijden

**Trigger:** Reservering buiten openingstijden
**Action:** Voice agent workflow starten

**Make.com Workflow:**

1. **Trigger:** Reservering aangemaakt
2. **Filter:** Check of buiten openingstijden
3. **HTTP Request:** Voice agent complete workflow
4. **Notification:** Email/SMS bevestiging

### Use Case 2: Grote Groepen (>6 personen)

**Trigger:** Reservering voor grote groep
**Action:** Voice call + email notificatie

**Make.com Workflow:**

1. **Trigger:** Reservering aangemaakt
2. **Filter:** Check party_size > 6
3. **HTTP Request:** Voice agent call
4. **Email:** Restaurant notificatie
5. **SMS:** Klant bevestiging

### Use Case 3: Speciale Verzoeken

**Trigger:** Reservering met speciale verzoeken
**Action:** Persoonlijke voice call

**Make.com Workflow:**

1. **Trigger:** Reservering met notes
2. **Filter:** Check speciale verzoeken
3. **HTTP Request:** Voice agent met custom script
4. **Follow-up:** Email met details

## 📡 API Response Voorbeelden

### Voice Agent Aanmaken Response

```json
{
  "success": true,
  "message": "Agent klaar voor Niki",
  "customer_name": "Niki",
  "customer_phone": "+32479397818",
  "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp",
  "fileSize": 327,
  "call_type": "outside_hours_notification",
  "language": "nl",
  "voice_model": "eleven_turbo_v2_5",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "status": "ready",
  "created_at": "2024-01-15T10:30:00.000Z",
  "twilio_phone": "+32 800 42 016"
}
```

### Twilio Call Response

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

## 🔄 Error Handling

### HTTP 400 Bad Request

**Oorzaken:**

- Ontbrekende customer_name of customer_phone
- Ongeldig telefoonnummer formaat

**Make.com Error Handler:**

```json
{
  "error": "Klantnaam en telefoonnummer zijn verplicht",
  "success": false
}
```

### HTTP 500 Server Error

**Oorzaken:**

- ElevenLabs API niet beschikbaar
- Twilio configuratie fout

**Make.com Error Handler:**

```json
{
  "error": "Server fout",
  "details": "ElevenLabs API niet beschikbaar"
}
```

## 🎛️ Make.com Scenario Templates

### Template 1: Buiten Openingstijden Voice Call

**Trigger:** Webhook (Reservering aangemaakt)
**Filter:**

```javascript
// Check of buiten openingstijden
const requestedTime = new Date(data.reservation_time);
const hour = requestedTime.getHours();
return hour < 8 || hour > 16;
```

**Action:** HTTP Request

```
URL: https://innovationstudio.be/api/voice-agent/complete-workflow
Method: POST
Body: {
  "customer_name": "{{customer_name}}",
  "customer_phone": "{{customer_phone}}"
}
```

### Template 2: Grote Groep Notificatie

**Trigger:** Webhook (Reservering aangemaakt)
**Filter:**

```javascript
// Check of grote groep
return data.party_size > 6;
```

**Action:** HTTP Request

```
URL: https://innovationstudio.be/api/voice-agent/twilio-call
Method: POST
Body: {
  "customer_name": "{{customer_name}}",
  "customer_phone": "{{customer_phone}}",
  "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp"
}
```

## 📊 Monitoring en Logging

### Voice Agent Logs

```json
{
  "success": true,
  "message": "Voice agent data gelogd voor Niki",
  "logged_data": {
    "agent_id": "agent_2801k1xa860xfwvbp0htwphv43dp",
    "customer_name": "Niki",
    "customer_phone": "+32479397818",
    "fileSize": 327,
    "call_type": "outside_hours_notification",
    "language": "nl",
    "voice_model": "eleven_turbo_v2_5",
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "status": "ready",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Deployment Checklist

- [ ] Server gedeployed op https://innovationstudio.be
- [ ] Environment variabelen geconfigureerd
- [ ] ElevenLabs agent actief (agent_2801k1xa860xfwvbp0htwphv43dp)
- [ ] Twilio account gekoppeld
- [ ] Make.com scenario's aangemaakt
- [ ] Error handling geïmplementeerd
- [ ] Monitoring ingesteld

## 🔗 Directe Links

- **Health Check:** https://innovationstudio.be/api/health
- **Voice Agent:** https://innovationstudio.be/api/voice-call
- **Twilio Call:** https://innovationstudio.be/api/voice-agent/twilio-call
- **Complete Workflow:** https://innovationstudio.be/api/voice-agent/complete-workflow

## 📞 Test Commands

### Test Voice Agent

```bash
curl -X POST https://innovationstudio.be/api/voice-call \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Niki De Kimpe",
    "customer_phone": "+32479397818"
  }'
```

### Test Twilio Call

```bash
curl -X POST https://innovationstudio.be/api/voice-agent/twilio-call \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Niki De Kimpe",
    "customer_phone": "+32479397818"
  }'
```

De voice agent is nu klaar voor Make.com integratie! 🎉
