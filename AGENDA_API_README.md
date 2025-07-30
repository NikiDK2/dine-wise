# Agenda API - Gebruikershandleiding

## 📋 Overzicht

De Agenda API is een complete oplossing voor het beheren van afspraken, reserveringen en evenementen in je restaurant. De API gebruikt momenteel de bestaande `reservations` tabel als basis, maar kan later worden uitgebreid naar een aparte `agenda_appointments` tabel.

## 🚀 Hoe te gebruiken

### 1. Navigeer naar de Agenda pagina

1. Open je RestoPlanner applicatie
2. Klik op "Agenda" in de sidebar (tussen Reviews en Rapporten)
3. Je ziet nu de agenda interface

### 2. Agenda Functionaliteiten

#### 📊 Statistieken bekijken

- **Totaal**: Aantal afspraken in de huidige maand
- **Bevestigd**: Aantal bevestigde afspraken
- **Gepland**: Aantal geplande afspraken
- **Personen**: Totaal aantal personen

#### 🔍 Zoeken en filteren

- **Zoeken**: Type een naam of titel om afspraken te vinden
- **Status filter**: Filter op status (Gepland, Bevestigd, Geannuleerd, Voltooid)

#### ➕ Nieuwe afspraak maken

1. Klik op "Nieuwe Afspraak" knop
2. Vul de gegevens in:
   - **Titel**: Naam van de afspraak
   - **Klant Naam**: Naam van de klant
   - **Aantal Personen**: Hoeveel mensen
   - **Status**: Gepland, Bevestigd, etc.
   - **Notities**: Extra informatie
3. Klik "Aanmaken"

#### ✏️ Afspraak bewerken

1. Klik op het potlood icoon naast een afspraak
2. Wijzig de gegevens
3. Klik "Bijwerken"

#### 🗑️ Afspraak verwijderen

1. Klik op het potlood icoon naast een afspraak
2. Klik op "Verwijderen" knop
3. Bevestig de verwijdering

## 🔧 Technische Details

### API Endpoints

De agenda API gebruikt de volgende hooks:

```typescript
// Afspraken ophalen
const { data: appointments } = useAgendaAppointments({
  restaurant_id: "your-restaurant-id",
  start_date: "2024-01-01",
  end_date: "2024-01-31",
});

// Nieuwe afspraak maken
const createAppointment = useCreateAgendaAppointment();
await createAppointment.mutateAsync({
  title: "Afspraak titel",
  customer_name: "Klant naam",
  party_size: 4,
  status: "confirmed",
  restaurant_id: "your-restaurant-id",
});

// Afspraak bijwerken
const updateAppointment = useUpdateAgendaAppointment();
await updateAppointment.mutateAsync({
  id: "appointment-id",
  status: "completed",
});

// Afspraak verwijderen
const deleteAppointment = useDeleteAgendaAppointment();
await deleteAppointment.mutateAsync("appointment-id");

// Statistieken ophalen
const { data: stats } = useAgendaStats(
  "restaurant-id",
  "2024-01-01",
  "2024-01-31"
);
```

### Data Structure

```typescript
interface AgendaAppointment {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed";
  type: "reservation" | "meeting" | "event" | "maintenance";
  party_size?: number;
  table_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  restaurant_id: string;
}
```

## 🎯 Gebruiksvoorbeelden

### Voorbeeld 1: Dagelijkse reserveringen bekijken

1. Ga naar de Agenda pagina
2. Gebruik de zoekfunctie om specifieke klanten te vinden
3. Filter op "Bevestigd" status om alleen bevestigde reserveringen te zien

### Voorbeeld 2: Nieuwe reservering maken

1. Klik "Nieuwe Afspraak"
2. Vul in:
   - Titel: "Familie Janssens"
   - Klant Naam: "Janssens"
   - Aantal Personen: 6
   - Status: "Bevestigd"
   - Notities: "Vraagt om tafel bij het raam"
3. Klik "Aanmaken"

### Voorbeeld 3: Reservering annuleren

1. Zoek de reservering
2. Klik op het potlood icoon
3. Verander status naar "Geannuleerd"
4. Klik "Bijwerken"

## 🔮 Toekomstige Uitbreidingen

### Geplande Features:

- **Kalender weergave**: Volledige kalender interface
- **Beschikbaarheid check**: Automatische controle van vrije tijdslots
- **Herhalende afspraken**: Dagelijkse, wekelijkse, maandelijkse afspraken
- **Notificaties**: Email/SMS herinneringen
- **Export**: CSV/PDF export van agenda data
- **Integratie**: Koppeling met externe kalender systemen

### Database Migratie:

Wanneer je klaar bent voor een aparte agenda tabel, kun je de migratie uitvoeren:

```sql
-- Zie: supabase/migrations/20250727133235-create-agenda-appointments.sql
```

## 🛠️ Troubleshooting

### Probleem: Afspraken worden niet opgeslagen

**Oplossing**: Controleer of je een restaurant hebt geselecteerd

### Probleem: Zoeken werkt niet

**Oplossing**: Zorg ervoor dat je de juiste zoekterm gebruikt (klantnaam of titel)

### Probleem: Statistieken kloppen niet

**Oplossing**: De statistieken zijn gebaseerd op de huidige maand, controleer de datum

## 📞 Support

Voor vragen of problemen met de Agenda API, neem contact op via de gebruikelijke kanalen.

---

**Versie**: 1.0.0  
**Laatste update**: Januari 2024
