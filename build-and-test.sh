#!/bin/bash

echo "🚀 RestoPlanner Build & Test Script"
echo "=================================="

# Colors voor output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functie om success/error messages te tonen
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
print_status $? "Dependencies installed"

echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build
print_status $? "Application built successfully"

echo -e "${YELLOW}🧪 Testing build output...${NC}"

# Test of dist folder bestaat
if [ -d "dist" ]; then
    print_status 0 "Dist folder created"
else
    print_status 1 "Dist folder not found"
fi

# Test of index.html bestaat
if [ -f "dist/index.html" ]; then
    print_status 0 "Index.html exists"
else
    print_status 1 "Index.html not found"
fi

# Test of assets folder bestaat
if [ -d "dist/assets" ]; then
    print_status 0 "Assets folder exists"
else
    print_status 1 "Assets folder not found"
fi

echo -e "${YELLOW}🔍 Checking for /restoplanner base path...${NC}"

# Test of index.html de juiste base path heeft
if grep -q 'href="/restoplanner/' dist/index.html; then
    print_status 0 "Base path /restoplanner/ found in HTML"
else
    print_status 1 "Base path /restoplanner/ not found in HTML"
fi

echo -e "${YELLOW}🌐 Starting test server...${NC}"
echo -e "${YELLOW}📡 Server will be available at: http://localhost:3001/restoplanner${NC}"
echo -e "${YELLOW}⏹️  Press Ctrl+C to stop the server${NC}"

# Start de server voor testing
npm run serve
