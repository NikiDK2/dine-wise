# 🚀 RestoPlanner Make.com Integratie

## 📋 **Overzicht**

Deze handleiding helpt je om de RestoPlanner API's te integreren in Make.com voor automatische workflows.

## 🔗 **API Endpoints**

### 1. **Health Check**

```
GET https://innovationstudio.be/api/health
```

**Doel:** Controleer of de API actief is

### 2. **Free/Busy Information**

```
GET https://innovationstudio.be/api/agenda/free-busy?restaurant_id=123&date=2024-01-15
```

**Doel:** Haal beschikbare tijdsloten op voor een specifieke datum

### 3. **Calendar Information**

```
GET https://innovationstudio.be/api/agenda/calendar?restaurant_id=123&start_date=2024-01-01&end_date=2024-01-31
```

**Doel:** Haal kalender informatie op voor een datumbereik

## 📥 **Import in Make.com**

### **Stap 1: Download Blueprint**

- Download het bestand: `RestoPlanner_Make_Blueprint.json`

### **Stap 2: Import in Make.com**

1. Ga naar Make.com
2. Klik op "Create a new scenario"
3. Klik op "Import" (rechtsboven)
4. Upload het `RestoPlanner_Make_Blueprint.json` bestand
5. Klik "Import"

### **Stap 3: Configureer HTTP Modules**

#### **Module 1: Health Check**

```
URL: https://innovationstudio.be/api/health
Method: GET
Headers:
  Content-Type: application/json
  Accept: application/json
```

#### **Module 2: Free/Busy Information**

```
URL: https://innovationstudio.be/api/agenda/free-busy
Method: GET
Query Parameters:
  restaurant_id: 123 (of jouw restaurant ID)
  date: {{formatDate(now; 'YYYY-MM-DD')}}
```

#### **Module 3: Calendar Information**

```
URL: https://innovationstudio.be/api/agenda/calendar
Method: GET
Query Parameters:
  restaurant_id: 123 (of jouw restaurant ID)
  start_date: {{formatDate(now; 'YYYY-MM-DD')}}
  end_date: {{formatDate(addDays(now; 7); 'YYYY-MM-DD')}}
```

## 🎯 **Praktische Voorbeelden**

### **Voorbeeld 1: Dagelijkse Beschikbaarheid Check**

```
Trigger: Schedule (elke dag om 9:00)
Action: HTTP Request naar Free/Busy API
Output: Email met beschikbare tijdsloten
```

### **Voorbeeld 2: Weekelijkse Planning**

```
Trigger: Schedule (elke maandag om 8:00)
Action: HTTP Request naar Calendar API
Output: Rapport met alle reserveringen van de week
```

### **Voorbeeld 3: API Monitoring**

```
Trigger: Schedule (elke 5 minuten)
Action: HTTP Request naar Health Check
Output: Slack/Email alert bij API downtime
```

## 🔧 **Configuratie Tips**

### **Dynamische Datums**

```javascript
// Vandaag
{{formatDate(now; 'YYYY-MM-DD')}}

// Morgen
{{formatDate(addDays(now; 1); 'YYYY-MM-DD')}}

// Volgende week
{{formatDate(addDays(now; 7); 'YYYY-MM-DD')}}

// Einde van de maand
{{formatDate(lastDayOfMonth(now); 'YYYY-MM-DD')}}
```

### **Error Handling**

```javascript
// Check of API response succesvol is
{{if(1.success = true; "API OK"; "API Error")}}

// Check aantal reserveringen
{{if(1.total_reservations > 0; "Er zijn reserveringen"; "Geen reserveringen")}}
```

## 🚨 **Foutafhandeling**

### **Veelvoorkomende Fouten**

| Fout                      | Oorzaak              | Oplossing                       |
| ------------------------- | -------------------- | ------------------------------- |
| 404 Not Found             | API niet bereikbaar  | Controleer URL en server status |
| 400 Bad Request           | Parameters ontbreken | Vul alle verplichte velden in   |
| 500 Internal Server Error | Database fout        | Controleer server logs          |

### **Retry Logic**

```javascript
// Automatische retry bij fouten
Max retries: 3
Retry delay: 30 seconds
```

## 📊 **Data Mapping**

### **Free/Busy Response Mapping**

```javascript
// Beschikbare tijdsloten
{{map(1.free_busy_periods; "type = 'free'")}}

// Bezette tijdsloten
{{map(1.free_busy_periods; "type = 'busy'")}}

// Totaal aantal reserveringen
{{1.total_reservations}}
```

### **Calendar Response Mapping**

```javascript
// Alle datums met reserveringen
{{map(1.calendar_data; "total_reservations > 0")}}

// Totaal aantal gasten
{{sum(1.calendar_data.total_party_size)}}
```

## 🔐 **Security**

### **API Keys**

- Momenteel geen API key vereist
- Alle endpoints zijn publiek toegankelijk
- CORS is geconfigureerd voor alle origins

### **Rate Limiting**

- Geen specifieke rate limits
- Gebruik redelijke intervallen (minimaal 30 seconden)

## 📞 **Support**

### **Test de API's**

```bash
# Health Check
curl https://innovationstudio.be/api/health

# Free/Busy
curl "https://innovationstudio.be/api/agenda/free-busy?restaurant_id=123&date=2024-01-15"

# Calendar
curl "https://innovationstudio.be/api/agenda/calendar?restaurant_id=123&start_date=2024-01-01&end_date=2024-01-31"
```

### **Contact**

- API Status: https://innovationstudio.be/api/health
- Website: https://innovationstudio.be
- Database: Supabase (echte data)

## ✅ **Checklist**

- [ ] Blueprint geïmporteerd in Make.com
- [ ] HTTP modules geconfigureerd
- [ ] Parameters aangepast naar jouw restaurant
- [ ] Health Check getest
- [ ] Free/Busy API getest
- [ ] Calendar API getest
- [ ] Error handling geconfigureerd
- [ ] Workflow geactiveerd

---

**🎉 Gefeliciteerd! Je RestoPlanner API's zijn nu geïntegreerd in Make.com!**
