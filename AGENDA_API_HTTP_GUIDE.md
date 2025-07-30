# 🚀 RestoPlanner Agenda API - HTTP Guide

## 📋 Overzicht

Deze gids legt uit hoe je met de RestoPlanner Agenda API kunt communiceren vanuit externe programma's via HTTP requests.

## 🔧 Setup

### 1. Start de API Server

```bash
# Installeer dependencies (al gedaan)
npm install express cors

# Start de API server
node server.js
```

De API draait dan op: `http://localhost:3001`

### 2. Authenticatie

Alle API calls vereisen een **Bearer token** in de Authorization header:

```http
Authorization: Bearer YOUR_SUPABASE_TOKEN
```

## 📡 API Endpoints

### 🔍 **GET** `/api/agenda/appointments` - Haal alle afspraken op

**Query Parameters:**

- `restaurant_id` (verplicht) - ID van het restaurant
- `start_date` (optioneel) - Start datum (YYYY-MM-DD)
- `end_date` (optioneel) - Eind datum (YYYY-MM-DD)
- `status` (optioneel) - Filter op status (pending, confirmed, cancelled, etc.)
- `customer_name` (optioneel) - Zoek op klantnaam

**Voorbeeld Request:**

```bash
curl -X GET "http://localhost:3001/api/agenda/appointments?restaurant_id=123&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
[
  {
    "id": "uuid",
    "title": "John Doe - 4 personen",
    "description": "Speciale verzoeken",
    "start_time": "2024-01-15T19:00:00",
    "end_time": "2024-01-15T19:00:00",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+31612345678",
    "status": "confirmed",
    "type": "reservation",
    "party_size": 4,
    "table_id": "table-uuid",
    "notes": "Notities",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-10T10:00:00Z",
    "restaurant_id": "123"
  }
]
```

---

### ➕ **POST** `/api/agenda/appointments` - Maak nieuwe afspraak

**Request Body:**

```json
{
  "title": "Nieuwe Reservering",
  "description": "Speciale verzoeken",
  "start_time": "2024-01-15T19:00:00",
  "end_time": "2024-01-15T20:00:00",
  "customer_name": "Jane Smith",
  "customer_email": "jane@example.com",
  "customer_phone": "+31687654321",
  "type": "reservation",
  "party_size": 6,
  "table_id": "table-uuid",
  "notes": "Verjaardag",
  "restaurant_id": "123"
}
```

**Verplichte velden:** `customer_name`, `start_time`, `restaurant_id`

**Voorbeeld Request:**

```bash
curl -X POST "http://localhost:3001/api/agenda/appointments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jane Smith",
    "start_time": "2024-01-15T19:00:00",
    "restaurant_id": "123",
    "party_size": 6,
    "customer_email": "jane@example.com"
  }'
```

---

### ✏️ **PUT** `/api/agenda/appointments/:id` - Update afspraak

**Request Body:** (alle velden optioneel)

```json
{
  "customer_name": "Jane Smith Updated",
  "party_size": 8,
  "status": "confirmed",
  "notes": "Bijgewerkte notities"
}
```

**Voorbeeld Request:**

```bash
curl -X PUT "http://localhost:3001/api/agenda/appointments/afspraak-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "party_size": 8,
    "status": "confirmed"
  }'
```

---

### 🗑️ **DELETE** `/api/agenda/appointments/:id` - Verwijder afspraak

**Voorbeeld Request:**

```bash
curl -X DELETE "http://localhost:3001/api/agenda/appointments/afspraak-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** 204 No Content

---

### 📅 **POST** `/api/agenda/availability` - Controleer beschikbaarheid

**Request Body:**

```json
{
  "start_date": "2024-01-15T00:00:00",
  "end_date": "2024-01-15T23:59:59",
  "restaurant_id": "123",
  "exclude_appointment_id": "afspraak-uuid"
}
```

**Voorbeeld Request:**

```bash
curl -X POST "http://localhost:3001/api/agenda/availability" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-01-15T00:00:00",
    "end_date": "2024-01-15T23:59:59",
    "restaurant_id": "123"
  }'
```

**Response:**

```json
[
  {
    "start_time": "2024-01-15T19:00:00.000Z",
    "end_time": "2024-01-15T19:30:00.000Z",
    "available": true
  },
  {
    "start_time": "2024-01-15T19:30:00.000Z",
    "end_time": "2024-01-15T20:00:00.000Z",
    "available": false,
    "conflicting_appointments": [
      {
        "id": "conflict-uuid",
        "title": "Bestaande Reservering - 4 personen",
        "customer_name": "John Doe"
      }
    ]
  }
]
```

---

### 📊 **GET** `/api/agenda/stats` - Haal statistieken op

**Query Parameters:**

- `restaurant_id` (verplicht) - ID van het restaurant
- `start_date` (optioneel) - Start datum
- `end_date` (optioneel) - Eind datum

**Voorbeeld Request:**

```bash
curl -X GET "http://localhost:3001/api/agenda/stats?restaurant_id=123&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "total": 25,
  "by_status": {
    "scheduled": 5,
    "confirmed": 15,
    "cancelled": 3,
    "completed": 2
  },
  "by_type": {
    "reservation": 25,
    "meeting": 0,
    "event": 0,
    "maintenance": 0
  },
  "total_party_size": 120
}
```

---

### 🔍 **GET** `/api/agenda/search` - Zoek afspraken

**Query Parameters:**

- `searchTerm` (verplicht) - Zoekterm
- `restaurant_id` (verplicht) - ID van het restaurant

**Voorbeeld Request:**

```bash
curl -X GET "http://localhost:3001/api/agenda/search?searchTerm=john&restaurant_id=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 🏥 **GET** `/health` - Health Check

**Voorbeeld Request:**

```bash
curl -X GET "http://localhost:3001/health"
```

**Response:**

```json
{
  "status": "OK",
  "message": "RestoPlanner Agenda API is actief"
}
```

## 💻 Code Voorbeelden

### JavaScript/Node.js

```javascript
const axios = require("axios");

const API_BASE = "http://localhost:3001/api/agenda";
const TOKEN = "YOUR_SUPABASE_TOKEN";

// Configuratie
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Alle afspraken ophalen
async function getAppointments(restaurantId) {
  try {
    const response = await api.get("/appointments", {
      params: { restaurant_id: restaurantId },
    });
    return response.data;
  } catch (error) {
    console.error("Fout bij ophalen afspraken:", error.response.data);
  }
}

// Nieuwe afspraak maken
async function createAppointment(appointmentData) {
  try {
    const response = await api.post("/appointments", appointmentData);
    return response.data;
  } catch (error) {
    console.error("Fout bij maken afspraak:", error.response.data);
  }
}

// Beschikbaarheid controleren
async function checkAvailability(startDate, endDate, restaurantId) {
  try {
    const response = await api.post("/availability", {
      start_date: startDate,
      end_date: endDate,
      restaurant_id: restaurantId,
    });
    return response.data;
  } catch (error) {
    console.error("Fout bij controleren beschikbaarheid:", error.response.data);
  }
}
```

### Python

```python
import requests
import json

API_BASE = "http://localhost:3001/api/agenda"
TOKEN = "YOUR_SUPABASE_TOKEN"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Alle afspraken ophalen
def get_appointments(restaurant_id):
    try:
        response = requests.get(
            f"{API_BASE}/appointments",
            headers=headers,
            params={"restaurant_id": restaurant_id}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Fout bij ophalen afspraken: {e}")
        return None

# Nieuwe afspraak maken
def create_appointment(appointment_data):
    try:
        response = requests.post(
            f"{API_BASE}/appointments",
            headers=headers,
            json=appointment_data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Fout bij maken afspraak: {e}")
        return None

# Beschikbaarheid controleren
def check_availability(start_date, end_date, restaurant_id):
    try:
        response = requests.post(
            f"{API_BASE}/availability",
            headers=headers,
            json={
                "start_date": start_date,
                "end_date": end_date,
                "restaurant_id": restaurant_id
            }
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Fout bij controleren beschikbaarheid: {e}")
        return None
```

### PHP

```php
<?php

$api_base = "http://localhost:3001/api/agenda";
$token = "YOUR_SUPABASE_TOKEN";

$headers = [
    "Authorization: Bearer " . $token,
    "Content-Type: application/json"
];

// Alle afspraken ophalen
function getAppointments($restaurant_id) {
    global $api_base, $headers;

    $url = $api_base . "/appointments?restaurant_id=" . urlencode($restaurant_id);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        return json_decode($response, true);
    } else {
        echo "Fout bij ophalen afspraken: HTTP $http_code";
        return null;
    }
}

// Nieuwe afspraak maken
function createAppointment($appointment_data) {
    global $api_base, $headers;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $api_base . "/appointments");
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($appointment_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 201) {
        return json_decode($response, true);
    } else {
        echo "Fout bij maken afspraak: HTTP $http_code";
        return null;
    }
}
?>
```

## 🔐 Authenticatie

### Hoe krijg je een Supabase Token?

1. **Log in** in je RestoPlanner applicatie
2. **Open Developer Tools** (F12)
3. **Ga naar Application/Storage tab**
4. **Zoek naar `sb-` cookies** of localStorage items
5. **Kopieer de access token**

Of via de Supabase client:

```javascript
const { data, error } = await supabase.auth.getSession();
const token = data.session?.access_token;
```

## ⚠️ Foutafhandeling

### Veelvoorkomende HTTP Status Codes:

- **200** - Success
- **201** - Created (nieuwe afspraak)
- **204** - No Content (verwijderd)
- **400** - Bad Request (ontbrekende parameters)
- **401** - Unauthorized (ongeldige token)
- **404** - Not Found
- **500** - Internal Server Error

### Fout Response Format:

```json
{
  "error": "Beschrijving van de fout"
}
```

## 🚀 Testen

### 1. Start de API Server

```bash
node server.js
```

### 2. Test de Health Check

```bash
curl http://localhost:3001/health
```

### 3. Test een API Call

```bash
curl -X GET "http://localhost:3001/api/agenda/stats?restaurant_id=YOUR_RESTAURANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Notities

- **Alle tijden** zijn in ISO 8601 formaat
- **Datums** zijn in YYYY-MM-DD formaat
- **UUIDs** worden gebruikt voor IDs
- **CORS** is ingeschakeld voor cross-origin requests
- **Rate limiting** is niet geïmplementeerd (kan later toegevoegd worden)

## 🔧 Troubleshooting

### "Cannot connect to server"

- Controleer of de server draait: `node server.js`
- Controleer de poort: standaard 3001

### "Unauthorized" errors

- Controleer of je token geldig is
- Vernieuw je token in de browser

### "Bad Request" errors

- Controleer of alle verplichte velden aanwezig zijn
- Controleer het data formaat

### Database connectie problemen

- Controleer je Supabase configuratie
- Controleer je environment variables

---

**🎉 Je bent nu klaar om de RestoPlanner Agenda API te gebruiken vanuit externe programma's!**
