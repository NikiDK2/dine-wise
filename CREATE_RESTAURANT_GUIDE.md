# 🏪 Restaurant Aanmaken Gids

## 📋 **Overzicht**

De nieuwe **Create Restaurant** pagina biedt een uitgebreide interface om een nieuw restaurant aan te maken met alle benodigde configuraties.

## 🚀 **Toegang tot de Pagina**

### **Via de Sidebar**

1. Klik op de **"Nieuw Restaurant"** knop in de linker sidebar
2. Of navigeer naar `/create-restaurant` in de browser

### **Via de Dashboard**

1. Ga naar de hoofdpagina (`/`)
2. Klik op **"Maak uw restaurant aan"** knop

## 📝 **Stappen om een Restaurant Aan te Maken**

### **Stap 1: Basis Informatie**

- **Restaurant naam** (verplicht)
- **Beschrijving** (optioneel)
- **Keukentype** (selecteer uit dropdown)
- **Adres** (verplicht)
- **Telefoon** (optioneel)
- **Email** (optioneel)

### **Stap 2: Openingstijden**

Configureer voor elke dag van de week:

- **Open/Gesloten** toggle
- **Openingstijd** (dropdown met 30-minuten intervallen)
- **Sluitingstijd** (dropdown met 30-minuten intervallen)

### **Stap 3: Reserveringsinstellingen**

- **Maximum groepsgrootte** (1-50 personen)
- **Minimum groepsgrootte** (1-10 personen)
- **Grote groep drempel** (voor handmatige goedkeuring)
- **Reserveringsduur** (30-300 minuten, in stappen van 30)
- **Automatisch bevestigen** (toggle)
- **Telefoonnummer verplicht** (toggle)
- **Email verplicht** (toggle)

### **Stap 4: Voorvertoning**

Controleer alle ingevoerde gegevens voordat u opslaat.

## 🎯 **Belangrijke Features**

### **Tabbed Interface**

- **Basis Info**: Restaurant gegevens
- **Openingstijden**: Dagelijkse openingstijden
- **Instellingen**: Reserveringsconfiguratie
- **Voorvertoning**: Controle van alle gegevens

### **Real-time Validatie**

- Verplichte velden worden gecontroleerd
- Submit knop is uitgeschakeld tot alle verplichte velden zijn ingevuld
- Real-time voorvertoning van alle gegevens

### **Responsive Design**

- Werkt op desktop, tablet en mobiel
- Collapsible sidebar ondersteuning
- Touch-vriendelijke interface

## 🔧 **Technische Details**

### **Database Schema**

Het restaurant wordt opgeslagen met:

```sql
- id (UUID, auto-generated)
- owner_id (gebruiker ID)
- name (verplicht)
- description
- address (verplicht)
- phone
- email
- cuisine_type
- opening_hours (JSON)
- settings (JSON)
- created_at
- updated_at
```

### **Openingstijden Format**

```json
{
  "monday": {
    "open": "17:00",
    "close": "22:00",
    "closed": false
  },
  "tuesday": {
    "open": "17:00",
    "close": "22:00",
    "closed": false
  }
  // ... etc voor alle dagen
}
```

### **Settings Format**

```json
{
  "max_party_size": 20,
  "min_party_size": 1,
  "max_reservations_per_slot": 10,
  "reservation_duration_minutes": 120,
  "large_group_threshold": 6,
  "auto_confirm_reservations": true,
  "require_phone_number": false,
  "require_email": true
}
```

## 🚨 **Foutafhandeling**

### **Validatie Fouten**

- Verplichte velden worden gecontroleerd
- Email format wordt gevalideerd
- Tijden worden gecontroleerd op logica

### **Database Fouten**

- Duplicate restaurant namen worden voorkomen
- Database connectie fouten worden getoond
- Rollback bij fouten

### **Netwerk Fouten**

- Timeout handling
- Retry mechanisme
- User feedback via toast notifications

## 📱 **Mobiele Optimalisatie**

### **Touch Interface**

- Grote touch targets
- Swipe navigatie tussen tabs
- Keyboard optimalisatie

### **Responsive Layout**

- Flexibele grid system
- Collapsible elementen
- Optimale tekst grootte

## 🔄 **Workflow**

1. **Navigeer** naar de Create Restaurant pagina
2. **Vul** basis informatie in
3. **Configureer** openingstijden
4. **Stel** reserveringsinstellingen in
5. **Controleer** voorvertoning
6. **Klik** "Restaurant Aanmaken"
7. **Word** doorgestuurd naar dashboard

## 🎨 **UI/UX Features**

### **Visual Feedback**

- Loading states tijdens opslaan
- Success/error toast notifications
- Progress indicators
- Disabled states voor incomplete formulieren

### **Accessibility**

- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode support

## 🔗 **Integratie**

### **Met Bestaande Systeem**

- Gebruikt bestaande auth context
- Integreert met restaurant hooks
- Volgt bestaande UI patterns
- Gebruikt gedeelde componenten

### **API Endpoints**

- POST `/api/restaurants` (indien backend API beschikbaar)
- Directe Supabase integratie
- Real-time updates

## 📊 **Monitoring**

### **Analytics**

- Page views tracking
- Form completion rates
- Error tracking
- Performance metrics

### **Logging**

- User actions logging
- Error logging
- Performance logging
- Audit trail

## 🚀 **Volgende Stappen**

Na het aanmaken van een restaurant:

1. **Tafels toevoegen** via Floor Plan
2. **Openingstijden verfijnen** via Settings
3. **Reserveringen testen** via Reservations
4. **Gasten beheren** via Guests
5. **Rapporten bekijken** via Reports
