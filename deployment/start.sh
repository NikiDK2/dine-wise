#!/bin/bash
echo "🚀 Starting RestPlanner..."
export NODE_ENV=production
npm install --production
node server.js
