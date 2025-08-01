# 🔧 Make.com HTTP Modules Handleiding

## 📋 **Stap-voor-Stap: HTTP Modules Maken in Make.com**

### **Stap 1: Maak een nieuw scenario**
1. Ga naar Make.com
2. Klik "Create a new scenario"
3. Geef je scenario een naam (bijv. "Check Beschikbaarheid")

### **Stap 2: Voeg HTTP module toe**
1. Klik op de "+" knop
2. Zoek naar "HTTP"
3. Selecteer "HTTP" module
4. Klik "Add"

### **Stap 3: Configureer HTTP module**

#### **Voor Check Beschikbaarheid:**
```
URL: https://innovationstudio.be/api/reservations/check-availability
Method: POST
Headers:
  Content-Type: application/json
  Accept: application/json
Body (JSON):
{
  "restaurant_id": "123",
  "requested_date": "2024-01-15",
  "requested_time": "19:00",
  "party_size": 4
}
```

#### **Voor Boek Reservering:**
```
URL: https://innovationstudio.be/api/reservations/book
Method: POST
Headers:
  Content-Type: application/json
  Accept: application/json
Body (JSON):
{
  "restaurant_id": "123",
  "reservation_date": "2024-01-15",
  "reservation_time": "19:00",
  "customer_name": "Jan Janssens",
  "customer_email": "jan@example.com",
  "customer_phone": "+31612345678",
  "party_size": 4,
  "notes": "Verjaardag"
}
```

#### **Voor Update Reservering:**
```
URL: https://innovationstudio.be/api/reservations/update
Method: PUT
Headers:
  Content-Type: application/json
  Accept: application/json
Body (JSON):
{
  "reservation_id": "uuid-123",
  "reservation_date": "2024-01-16",
  "reservation_time": "20:00",
  "customer_name": "Jan Janssens",
  "party_size": 6,
  "notes": "Verjaardag + extra gasten"
}
```

#### **Voor Verwijder Reservering:**
```
URL: https://innovationstudio.be/api/reservations/delete
Method: DELETE
Headers:
  Content-Type: application/json
  Accept: application/json
Body (JSON):
{
  "reservation_id": "uuid-123"
}
```

### **Stap 4: Test de module**
1. Klik op "Run once" om te testen
2. Controleer de response
3. Zorg dat je geen fouten krijgt

### **Stap 5: Configureer dynamische waarden**
Gebruik Make.com formules voor dynamische waarden:

```javascript
// Vandaag
{{formatDate(now; 'YYYY-MM-DD')}}

// Morgen
{{formatDate(addDays(now; 1); 'YYYY-MM-DD')}}

// Restaurant ID (pas aan naar jouw ID)
"123"

// Customer name (van webhook/trigger)
{{trigger.customer_name}}
```

## 🎯 **4 Scenario's die je moet maken:**

### **Scenario 1: Check Beschikbaarheid**
- **Trigger:** Webhook of Manual
- **Action:** HTTP Request naar check-availability
- **Output:** Email/SMS met resultaat

### **Scenario 2: Boek Reservering**
- **Trigger:** Webhook of Manual
- **Action:** HTTP Request naar book
- **Output:** Email bevestiging naar klant

### **Scenario 3: Update Reservering**
- **Trigger:** Email/SMS van klant
- **Action:** HTTP Request naar update
- **Output:** Email bevestiging van wijziging

### **Scenario 4: Verwijder Reservering**
- **Trigger:** Email/SMS van klant
- **Action:** HTTP Request naar delete
- **Output:** Email bevestiging van annulering

## 🔧 **HTTP Module Configuratie Details**

### **Algemene instellingen:**
- **Timeout:** 15000 ms (15 seconden)
- **Retry:** 3 pogingen
- **Retry delay:** 30 seconden

### **Headers (altijd hetzelfde):**
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### **Error Handling:**
```javascript
// In Make.com router
{{if(1.success = true; "OK"; "ERROR")}}

// Check voor specifieke fouten
{{if(1.error = "Tijdstip is niet beschikbaar"; "Niet beschikbaar"; "Beschikbaar")}}
```

## 📊 **Response Mapping**

### **Check Beschikbaarheid Response:**
```javascript
// Beschikbaarheid
{{1.available}}

// Alternatieve tijden
{{1.alternative_times}}

// Conflicterende reserveringen
{{1.conflicting_reservations}}
```

### **Boek Reservering Response:**
```javascript
// Reservering ID
{{1.reservation.id}}

// Klant naam
{{1.reservation.customer_name}}

// Datum en tijd
{{1.reservation.reservation_date}}
{{1.reservation.reservation_time}}
```

### **Update/Delete Response:**
```javascript
// Succes status
{{1.updated}}
{{1.deleted}}

// Bericht
{{1.message}}
```

## 🚨 **Veelvoorkomende Fouten**

### **400 Bad Request:**
- Controleer of alle verplichte velden zijn ingevuld
- Controleer JSON syntax

### **404 Not Found:**
- Controleer of reservation_id correct is
- Controleer of URL correct is

### **409 Conflict:**
- Tijdstip is niet beschikbaar
- Gebruik alternative_times uit response

### **500 Internal Server Error:**
- Database fout
- Controleer server logs

## ✅ **Test Checklist**

- [ ] HTTP module geconfigureerd
- [ ] URL correct ingevuld
- [ ] Method correct (POST/PUT/DELETE)
- [ ] Headers correct
- [ ] Body JSON correct
- [ ] Test run succesvol
- [ ] Response correct
- [ ] Error handling geconfigureerd

## 🎉 **Resultaat**

Na deze stappen heb je 4 werkende HTTP modules in Make.com die kunnen:
- ✅ Beschikbaarheid controleren
- ✅ Reserveringen aanmaken
- ✅ Reserveringen aanpassen
- ✅ Reserveringen annuleren

**Je kunt nu automatische workflows maken voor je restaurant!** 🚀 