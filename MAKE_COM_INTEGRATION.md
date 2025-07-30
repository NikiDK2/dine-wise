# 🔗 Make.com Integratie - RestoPlanner API

## 📋 Overzicht

Deze gids legt uit hoe je Make.com kunt integreren met de RestoPlanner API voor automatische reserveringen.

## 🎯 API Endpoints voor Make.com

### **1. Beschikbaarheid Controleren + Automatisch Boeken**

```
POST /api/agenda/check-and-book
```

**Request Body:**

```json
{
  "restaurant_id": "ce326c61-ca96-4b55-aae0-04046f2bbb17",
  "requested_date": "2024-01-15",
  "requested_time": "19:00",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+31612345678",
  "party_size": 4,
  "notes": "Verjaardag",
  "auto_book": true
}
```

**Response (Beschikbaar):**

```json
{
  "success": true,
  "available": true,
  "booked": true,
  "reservation": {
    "id": "uuid",
    "customer_name": "John Doe",
    "reservation_date": "2024-01-15",
    "reservation_time": "19:00",
    "party_size": 4,
    "status": "confirmed"
  },
  "message": "Reservering succesvol aangemaakt"
}
```

**Response (Niet Beschikbaar):**

```json
{
  "success": true,
  "available": false,
  "booked": false,
  "requested_date": "2024-01-15",
  "requested_time": "19:00",
  "conflicting_reservations": [
    {
      "id": "uuid",
      "customer_name": "Jane Smith",
      "reservation_time": "19:00",
      "party_size": 6
    }
  ],
  "alternative_times": ["18:00", "18:30", "20:00", "20:30", "21:00"],
  "message": "Tijdstip is niet beschikbaar, hier zijn alternatieven"
}
```

### **2. Alleen Beschikbaarheid Controleren**

```
POST /api/agenda/check-availability
```

**Request Body:**

```json
{
  "restaurant_id": "ce326c61-ca96-4b55-aae0-04046f2bbb17",
  "requested_date": "2024-01-15",
  "requested_time": "19:00",
  "party_size": 4
}
```

### **3. Direct Boeken (Zonder Check)**

```
POST /api/agenda/book
```

**Request Body:**

```json
{
  "restaurant_id": "ce326c61-ca96-4b55-aae0-04046f2bbb17",
  "reservation_date": "2024-01-15",
  "reservation_time": "19:00",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+31612345678",
  "party_size": 4,
  "notes": "Verjaardag"
}
```

### **4. Beschikbare Tijdstippen Ophalen**

```
GET /api/agenda/available-times?restaurant_id=ce326c61-ca96-4b55-aae0-04046f2bbb17&date=2024-01-15&party_size=4
```

**Response:**

```json
{
  "success": true,
  "date": "2024-01-15",
  "available_times": ["17:00", "17:30", "18:00", "18:30", "20:00"],
  "message": "Beschikbare tijdstippen voor 2024-01-15"
}
```

## 🔧 Make.com Scenario Setup

### **Scenario 1: Automatische Reservering**

#### **Stap 1: Trigger (Webhook/Email/SMS)**

- **Trigger:** Nieuwe reservering aanvraag
- **Data:** Klantgegevens + gewenste datum/tijd

#### **Stap 2: HTTP Request naar API**

```
Method: POST
URL: https://jouw-domein.com/api/agenda/check-and-book
Headers:
  Content-Type: application/json
Body: {
  "restaurant_id": "ce326c61-ca96-4b55-aae0-04046f2bbb17",
  "requested_date": "{{trigger.date}}",
  "requested_time": "{{trigger.time}}",
  "customer_name": "{{trigger.customer_name}}",
  "customer_email": "{{trigger.customer_email}}",
  "customer_phone": "{{trigger.customer_phone}}",
  "party_size": "{{trigger.party_size}}",
  "auto_book": true
}
```

#### **Stap 3: Router (Beschikbaar/Niet Beschikbaar)**

```
Condition: {{response.available}} == true
```

#### **Stap 4A: Beschikbaar - Bevestiging Sturen**

```
Action: Email/SMS
To: {{trigger.customer_email}}
Subject: Reservering Bevestigd
Body: Uw reservering voor {{trigger.date}} om {{trigger.time}} is bevestigd.
```

#### **Stap 4B: Niet Beschikbaar - Alternatieven Sturen**

```
Action: Email/SMS
To: {{trigger.customer_email}}
Subject: Alternatieve Tijdstippen
Body: Het gewenste tijdstip is niet beschikbaar. Alternatieven: {{response.alternative_times}}
```

### **Scenario 2: Beschikbaarheid Check**

#### **Stap 1: Trigger**

- **Trigger:** Website formulier
- **Data:** Gewenste datum/tijd

#### **Stap 2: HTTP Request**

```
Method: POST
URL: https://jouw-domein.com/api/agenda/check-availability
Body: {
  "restaurant_id": "ce326c61-ca96-4b55-aae0-04046f2bbb17",
  "requested_date": "{{trigger.date}}",
  "requested_time": "{{trigger.time}}",
  "party_size": "{{trigger.party_size}}"
}
```

#### **Stap 3: Response Verwerken**

```
Action: Webhook Response
Data: {{response}}
```

## 📊 Make.com HTTP Module Configuratie

### **Basis Configuratie:**

- **URL:** `https://jouw-domein.com/api/agenda/check-and-book`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
- **Body:** JSON met reservering data

### **Error Handling:**

```javascript
// In Make.com HTTP module
if (response.status >= 400) {
  // Handle error
  throw new Error(`API Error: ${response.data.error}`);
}
```

### **Response Mapping:**

```javascript
// Map response data
const isAvailable = response.data.available;
const isBooked = response.data.booked;
const reservationId = response.data.reservation?.id;
const alternativeTimes = response.data.alternative_times;
```

## 🔄 Workflow Voorbeelden

### **Workflow 1: Website Reservering**

```
1. Website Form → Make.com Webhook
2. Make.com → API Check & Book
3. API Response → Router
4. Router → Email Bevestiging/Alternatieven
5. Router → Database Update
```

### **Workflow 2: Telefoon Reservering**

```
1. Telefoon Call → Manual Entry
2. Manual Entry → API Check & Book
3. API Response → SMS Bevestiging
4. API Response → Restaurant Notificatie
```

### **Workflow 3: Email Reservering**

```
1. Email → Email Parser
2. Email Parser → API Check & Book
3. API Response → Email Reply
4. API Response → Calendar Update
```

## 🛠️ Troubleshooting

### **Veelvoorkomende Fouten:**

#### **1. "restaurant_id is verplicht"**

```json
// Zorg dat je restaurant_id correct is
{
  "restaurant_id": "ce326c61-ca96-4b55-aae0-04046f2bbb17"
}
```

#### **2. "requested_date is verplicht"**

```json
// Gebruik YYYY-MM-DD formaat
{
  "requested_date": "2024-01-15"
}
```

#### **3. "requested_time is verplicht"**

```json
// Gebruik HH:MM formaat
{
  "requested_time": "19:00"
}
```

### **Testing in Make.com:**

1. **Test met kleine data set**
2. **Controleer response format**
3. **Test error scenarios**
4. **Monitor API logs**

## 📈 Monitoring & Analytics

### **API Metrics:**

- **Requests per dag**
- **Success rate**
- **Response times**
- **Error rates**

### **Make.com Analytics:**

- **Scenario executions**
- **Success/failure rates**
- **Processing times**
- **Data throughput**

## 🔒 Security

### **API Key Authentication:**

```json
// Voeg API key toe aan headers
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

### **Rate Limiting:**

- **Max 100 requests/minuut per IP**
- **Max 1000 requests/dag per restaurant**

### **Data Validation:**

- **Input sanitization**
- **Date/time validation**
- **Email format validation**

## 🎉 Resultaat

Na setup heb je:

- ✅ **Automatische reserveringen** via Make.com
- ✅ **Real-time beschikbaarheid checks**
- ✅ **Automatische alternatieven suggesties**
- ✅ **Email/SMS bevestigingen**
- ✅ **Database synchronisatie**

Je restaurant kan nu automatisch reserveringen verwerken via Make.com! 🚀
