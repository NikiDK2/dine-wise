# 📋 API Request Variabelen Overzicht

## 🔍 **1. Check Beschikbaarheid**

**Endpoint:** `POST /api/reservations/check-availability`

### **Verplichte Variabelen:**

```json
{
  "restaurant_id": "{{YOUR_RESTAURANT_ID}}",
  "requested_date": "2024-01-15",
  "requested_time": "19:00",
  "party_size": 4
}
```

### **Headers:**

```
Content-Type: application/json
Accept: application/json
```

---

## 📅 **2. Boek Reservering**

**Endpoint:** `POST /api/reservations/book`

### **Verplichte Variabelen:**

```json
{
  "restaurant_id": "{{YOUR_RESTAURANT_ID}}",
  "reservation_date": "2024-01-15",
  "reservation_time": "19:00",
  "customer_name": "Jan Janssens",
  "party_size": 4
}
```

### **Optionele Variabelen:**

```json
{
  "customer_email": "jan@example.com",
  "customer_phone": "+31612345678",
  "notes": "Verjaardag"
}
```

### **Headers:**

```
Content-Type: application/json
Accept: application/json
```

---

## ✏️ **3. Update Reservering**

**Endpoint:** `PUT /api/reservations/update`

### **Verplichte Variabelen:**

```json
{
  "reservation_id": "{{RESERVATION_ID}}"
}
```

### **Optionele Variabelen:**

```json
{
  "reservation_date": "2024-01-16",
  "reservation_time": "20:00",
  "customer_name": "Jan Janssens",
  "customer_email": "jan@example.com",
  "customer_phone": "+31612345678",
  "party_size": 6,
  "notes": "Verjaardag + extra gasten",
  "status": "confirmed"
}
```

### **Headers:**

```
Content-Type: application/json
Accept: application/json
```

---

## 🗑️ **4. Verwijder Reservering**

**Endpoint:** `DELETE /api/reservations/delete`

### **Verplichte Variabelen:**

```json
{
  "reservation_id": "{{RESERVATION_ID}}"
}
```

### **Headers:**

```
Content-Type: application/json
Accept: application/json
```

---

## 📊 **5. Restaurant Capaciteit**

**Endpoint:** `GET /api/restaurant/capacity`

### **Query Parameters:**

```
?restaurant_id={{YOUR_RESTAURANT_ID}}
```

---

## 📅 **6. Agenda Endpoints**

### **Agenda Health Check:**

```
GET /api/agenda/health
```

### **Agenda Appointments:**

```
GET /api/agenda/appointments?restaurant_id={{YOUR_RESTAURANT_ID}}
```

### **Create Agenda Appointment:**

```
POST /api/agenda/appointments
```

**Body:**

```json
{
  "restaurant_id": "{{YOUR_RESTAURANT_ID}}",
  "title": "Nieuwe Afspraak",
  "start_time": "2024-01-15T19:00:00",
  "end_time": "2024-01-15T20:00:00",
  "customer_name": "Jan Janssens",
  "type": "reservation",
  "party_size": 4
}
```

---

## 🎯 **Dynamische Waarden voor Make.com**

### **Datum/Tijd Formules:**

```javascript
// Vandaag
{{formatDate(now; 'YYYY-MM-DD')}}

// Morgen
{{formatDate(addDays(now; 1); 'YYYY-MM-DD')}}

// Tijdstip
{{formatDate(now; 'HH:mm')}}

// Restaurant ID (vervang door jouw ID)
"550e8400-e29b-41d4-a716-446655440000"

// Customer name (van webhook/trigger)
{{trigger.customer_name}}

// Party size (van webhook/trigger)
{{trigger.party_size}}
```

### **Voorbeeld Make.com Request:**

```json
{
  "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
  "requested_date": "{{formatDate(now; 'YYYY-MM-DD')}}",
  "requested_time": "19:00",
  "party_size": {{trigger.party_size}},
  "customer_name": "{{trigger.customer_name}}",
  "customer_email": "{{trigger.customer_email}}",
  "customer_phone": "{{trigger.customer_phone}}"
}
```

---

## ⚠️ **Belangrijke Notities:**

1. **Restaurant ID**: Moet altijd worden meegegeven
2. **Datum formaat**: `YYYY-MM-DD` (bijv. "2024-01-15")
3. **Tijd formaat**: `HH:mm` (bijv. "19:00")
4. **Party size**: Moet een getal zijn groter dan 0
5. **Customer name**: Verplicht voor reserveringen
6. **Reservation ID**: Verplicht voor updates/verwijderingen

---

## 🧪 **Test Voorbeelden:**

### **Check Beschikbaarheid:**

```bash
curl -X POST "http://localhost:3001/api/reservations/check-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "requested_date": "2024-12-25",
    "requested_time": "19:00",
    "party_size": 4
  }'
```

### **Boek Reservering:**

```bash
curl -X POST "http://localhost:3001/api/reservations/book" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "reservation_date": "2024-12-25",
    "reservation_time": "19:00",
    "customer_name": "Test Klant",
    "customer_email": "test@example.com",
    "party_size": 4,
    "notes": "Test reservering"
  }'
```
