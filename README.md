# RestoPlanner2 - Restaurant Management System

Een moderne web-applicatie voor restaurant management, gebouwd met React, TypeScript en Supabase.

## 🚀 Features

- **Reserveringen beheer**: Volledig CRUD systeem voor reserveringen
- **Vloerplan**: Interactieve tafelindeling met drag & drop functionaliteit
- **Klantenbeheer**: Klantprofielen en geschiedenis
- **Wachtlijst**: Real-time wachtlijst beheer
- **Dashboard**: Overzicht van dagelijkse activiteiten
- **Agenda integratie**: Synchronisatie met externe agenda systemen
- **Notificaties**: Real-time meldingen voor nieuwe reserveringen
- **Responsive design**: Werkt perfect op desktop en mobiel

## 🛠️ Technologieën

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Zustand
- **Deployment**: Vercel, Combell, VPS opties

## 📦 Installatie

### Vereisten

- Node.js 18+
- npm of bun

### Lokale ontwikkeling

```bash
# 1. Clone de repository
git clone https://github.com/NikiDK2/dine-wise.git

# 2. Ga naar de project directory
cd dine-wise

# 3. Installeer dependencies
npm install

# 4. Kopieer environment variabelen
cp env.example .env

# 5. Configureer je environment variabelen
# Zie ENVIRONMENT_SETUP.md voor gedetailleerde instructies

# 6. Start de development server
npm run dev
```

De applicatie is nu beschikbaar op `http://localhost:5173`

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build voor productie
npm run preview      # Preview van productie build
npm run lint         # ESLint check
npm run clean:modules # Verwijder node_modules en installeer opnieuw
```

## 🌐 Deployment

### Vercel (Aanbevolen)

```bash
npm run build
# Deploy naar Vercel via GitHub integratie
```

### Combell

Zie `COMBELL_DEPLOYMENT.md` voor gedetailleerde instructies.

### VPS

Zie `VPS_DEPLOYMENT.md` voor server setup instructies.

## 📁 Project Structuur

```
src/
├── components/          # React componenten
│   ├── agenda/         # Agenda gerelateerde componenten
│   ├── auth/           # Authenticatie componenten
│   ├── customers/      # Klantenbeheer
│   ├── dashboard/      # Dashboard componenten
│   ├── floor-plan/     # Vloerplan componenten
│   ├── layout/         # Layout componenten
│   ├── reservations/   # Reserveringen
│   ├── restaurant/     # Restaurant beheer
│   ├── settings/       # Instellingen
│   ├── tables/         # Tafelbeheer
│   ├── ui/             # UI componenten (shadcn/ui)
│   └── waitlist/       # Wachtlijst beheer
├── hooks/              # Custom React hooks
├── integrations/       # Externe integraties (Supabase)
├── pages/              # Pagina componenten
├── services/           # API services
└── utils/              # Utility functies
```

## 🔐 Environment Variabelen

Maak een `.env.local` bestand aan met:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AGENDA_API_URL=your_agenda_api_url
VITE_AGENDA_API_KEY=your_agenda_api_key
```

## 📚 Documentatie

- [API Documentatie](AGENDA_API_README.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Volledige Deployment Guide](FULL_SITE_DEPLOYMENT.md)

## 🤝 Bijdragen

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is privé eigendom.

## 📞 Support

Voor vragen of problemen, neem contact op via GitHub Issues.

---

**RestoPlanner2** - Modern restaurant management voor de 21e eeuw 🍽️
# Voice agent cleanup complete
