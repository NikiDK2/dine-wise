# RestoPlanner Agenda API - Make.com Integratie

## Base URL

```
https://innovationstudio.be/api/agenda
```

## Beschikbare Endpoints

### 1. Health Check

**GET** `/health`

Controleer of de API actief is.

**Response:**

```json
{
  "success": true,
  "status": "OK",
  "message": "Agenda API is actief (vereenvoudigde versie)",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Free/Busy Information

**GET** `/free-busy`

Haal beschikbare en bezette tijdstippen op voor een specifieke datum.

**Query Parameters:**

- `restaurant_id` (verplicht): ID van het restaurant
- `date` (verplicht): Datum in YYYY-MM-DD formaat
- `start_time` (optioneel): Starttijd (default: "17:00")
- `end_time` (optioneel): Eindtijd (default: "22:00")
- `interval_minutes` (optioneel): Interval tussen tijdstippen (default: 30)

**Voorbeeld:**

```
GET /api/agenda/free-busy?restaurant_id=1&date=2024-01-15&start_time=17:00&end_time=22:00&interval_minutes=30
```

**Response:**

```json
{
  "success": true,
  "restaurant_id": "1",
  "date": "2024-01-15",
  "free_busy_periods": [
    {
      "type": "free",
      "start_time": "17:00",
      "end_time": "18:30"
    },
    {
      "type": "busy",
      "start_time": "18:30",
      "end_time": "19:30",
      "reservations": [
        {
          "id": "123",
          "customer_name": "Jan Jansen",
          "party_size": 4,
          "reservation_time": "18:30"
        }
      ]
    },
    {
      "type": "free",
      "start_time": "19:30",
      "end_time": "22:00"
    }
  ],
  "time_slots": [
    {
      "time": "17:00",
      "available": true,
      "busy": false,
      "conflicting_reservations": []
    },
    {
      "time": "17:30",
      "available": true,
      "busy": false,
      "conflicting_reservations": []
    }
  ],
  "summary": {
    "total_slots": 10,
    "available_slots": 8,
    "busy_slots": 2,
    "total_reservations": 1
  },
  "message": "Free/Busy informatie voor 2024-01-15"
}
```

### 3. Calendar Information

**GET** `/calendar`

Haal kalender informatie op voor een periode.

**Query Parameters:**

- `restaurant_id` (verplicht): ID van het restaurant
- `start_date` (verplicht): Startdatum in YYYY-MM-DD formaat
- `end_date` (verplicht): Einddatum in YYYY-MM-DD formaat
- `include_details` (optioneel): Include klantdetails (default: false)

**Voorbeeld:**

```
GET /api/agenda/calendar?restaurant_id=1&start_date=2024-01-01&end_date=2024-01-31&include_details=true
```

**Response:**

```json
{
  "success": true,
  "restaurant_id": "1",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "calendar_data": [
    {
      "date": "2024-01-15",
      "reservations": [
        {
          "id": "123",
          "customer_name": "Jan Jansen",
          "reservation_time": "18:30",
          "party_size": 4,
          "status": "confirmed",
          "customer_email": "jan@example.com",
          "customer_phone": "+31612345678",
          "notes": "Allergie voor noten",
          "special_requests": "Tafel bij het raam"
        }
      ],
      "total_reservations": 1,
      "total_party_size": 4
    }
  ],
  "summary": {
    "total_days": 31,
    "total_reservations": 15,
    "total_party_size": 45
  },
  "message": "Kalender informatie van 2024-01-01 tot 2024-01-31"
}
```

### 4. Check Availability

**POST** `/check-availability`

Controleer beschikbaarheid voor een specifiek tijdstip.

**Request Body:**

```json
{
  "restaurant_id": "1",
  "requested_date": "2024-01-15",
  "requested_time": "18:30",
  "party_size": 4
}
```

**Response:**

```json
{
  "success": true,
  "available": false,
  "requested_date": "2024-01-15",
  "requested_time": "18:30",
  "conflicting_reservations": [
    {
      "id": "123",
      "customer_name": "Jan Jansen",
      "reservation_time": "18:30",
      "party_size": 4
    }
  ],
  "message": "Tijdstip is niet beschikbaar"
}
```

### 5. Check and Book

**POST** `/check-and-book`

Controleer beschikbaarheid en boek eventueel automatisch.

**Request Body:**

```json
{
  "restaurant_id": "1",
  "requested_date": "2024-01-15",
  "requested_time": "19:30",
  "customer_name": "Piet Pietersen",
  "customer_email": "piet@example.com",
  "customer_phone": "+31612345678",
  "party_size": 2,
  "notes": "Verjaardag",
  "auto_book": true
}
```

**Response:**

```json
{
  "success": true,
  "available": true,
  "booked": true,
  "reservation": {
    "id": "124",
    "customer_name": "Piet Pietersen",
    "reservation_date": "2024-01-15",
    "reservation_time": "19:30",
    "party_size": 2,
    "status": "confirmed"
  },
  "message": "Reservering succesvol aangemaakt"
}
```

## Make.com Integratie Voorbeelden

### 1. Dagelijkse Free/Busy Check

```javascript
// In Make.com HTTP module
const response = await fetch(
  "https://innovationstudio.be/api/agenda/free-busy?restaurant_id=1&date=2024-01-15"
);
const data = await response.json();

// Verwerk de data
data.free_busy_periods.forEach((period) => {
  if (period.type === "free") {
    console.log(`Vrij van ${period.start_time} tot ${period.end_time}`);
  } else {
    console.log(`Bezet van ${period.start_time} tot ${period.end_time}`);
  }
});
```

### 2. Wekelijkse Kalender Overzicht

```javascript
// In Make.com HTTP module
const startDate = new Date().toISOString().split("T")[0];
const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

const response = await fetch(
  `https://innovationstudio.be/api/agenda/calendar?restaurant_id=1&start_date=${startDate}&end_date=${endDate}`
);
const data = await response.json();

// Verwerk de data
data.calendar_data.forEach((day) => {
  console.log(
    `${day.date}: ${day.total_reservations} reserveringen, ${day.total_party_size} personen`
  );
});
```

### 3. Automatische Booking

```javascript
// In Make.com HTTP module
const bookingData = {
  restaurant_id: "1",
  requested_date: "2024-01-15",
  requested_time: "19:30",
  customer_name: "Nieuwe Klant",
  customer_email: "klant@example.com",
  party_size: 2,
  auto_book: true,
};

const response = await fetch(
  "https://innovationstudio.be/api/agenda/check-and-book",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingData),
  }
);

const result = await response.json();
if (result.booked) {
  console.log(`Reservering aangemaakt met ID: ${result.reservation.id}`);
}
```

## Error Handling

Alle endpoints retourneren consistente error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly error message"
}
```

## Rate Limiting

- Max 100 requests per minuut per IP
- Max 1000 requests per uur per IP

## Authentication

Momenteel geen authenticatie vereist voor basis functionaliteit. Voor productie gebruik wordt aangeraden om API keys te implementeren.
