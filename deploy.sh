#!/bin/bash

# Deployment script voor RestoPlanner
echo "🚀 RestoPlanner Deployment gestart..."

# Installeer dependencies
echo "📦 Dependencies installeren..."
npm install

# Bouw de frontend
echo "🔨 Frontend bouwen..."
npm run build

# Start de server
echo "🌐 Server starten..."
npm run serve 