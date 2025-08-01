#!/bin/bash

# RestoPlanner Deployment Script
echo "🚀 Starting RestoPlanner deployment..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start the server
    echo "🔄 Starting server..."
    NODE_ENV=production node server.cjs &
    SERVER_PID=$!
    
    echo "✅ Server started with PID: $SERVER_PID"
    echo "🌐 Application available at: https://innovationstudio.be"
    echo "📡 API available at: https://innovationstudio.be/api/health"
    echo "📅 Agenda API available at: https://innovationstudio.be/api/agenda/health"
    
    # Keep the script running
    wait $SERVER_PID
else
    echo "❌ Build failed!"
    exit 1
fi 