# Environment Variabelen Setup

## 📋 Overzicht

Dit document legt uit hoe je de environment variabelen moet configureren voor RestoPlanner.

## 🔧 Verplichte Environment Variabelen

### Voor Development (Frontend)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Voor Production (Server)

```bash
# Restaurant Configuration
RESTAURANT_ID=your-restaurant-uuid-here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# Server Configuration
PORT=3001
CORS_ORIGIN=https://your-domain.com
API_BASE_URL=https://your-domain.com
```

## 🚀 Setup Stappen

### 1. Kopieer Environment Template

```bash
cp env.example .env
```

### 2. Vul de Waarden In

#### Supabase Project Setup

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecteer je project
3. Ga naar Settings > API
4. Kopieer de volgende waarden:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

#### Restaurant ID

1. Ga naar je Supabase database
2. Zoek in de `restaurants` tabel
3. Kopieer de `id` van je restaurant → `RESTAURANT_ID`

### 3. Valideer Configuratie

#### Frontend (Development)

```bash
npm run dev
```

Controleer of er geen errors zijn in de console.

#### Server (Production)

```bash
node server-minimal.js
```

Je zou deze output moeten zien:

```
✅ Server geconfigureerd met environment variabelen
📍 Restaurant ID: your-restaurant-uuid
🔗 Supabase URL: https://your-project.supabase.co
```

## 🔒 Security Best Practices

### ✅ Do's

- Gebruik altijd environment variabelen voor gevoelige data
- Voeg `.env` toe aan `.gitignore`
- Gebruik verschillende keys voor development en production
- Valideer environment variabelen bij startup

### ❌ Don'ts

- Commit nooit `.env` bestanden naar Git
- Gebruik nooit hardcoded credentials in code
- Deel nooit service role keys publiekelijk
- Gebruik geen development keys in production

## 🐛 Troubleshooting

### "Environment variabele is verplicht" Error

Zorg dat alle verplichte variabelen zijn ingesteld:

```bash
echo $RESTAURANT_ID
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Supabase Connection Error

Controleer of je Supabase URL en keys correct zijn:

1. Test de URL in je browser
2. Controleer of de keys niet verlopen zijn
3. Zorg dat je project actief is

### Restaurant Not Found Error

Controleer of je `RESTAURANT_ID` correct is:

1. Ga naar Supabase Dashboard
2. Controleer de `restaurants` tabel
3. Zorg dat de ID exact overeenkomt

## 📚 Meer Informatie

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js Environment Variables](https://nodejs.org/en/learn/getting-started/environment-variables)
