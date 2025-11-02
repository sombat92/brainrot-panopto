#!/bin/bash

# Quick script to check if all servers are running

echo "🔍 Checking Server Status..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend (port 3000): Running"
else
    echo -e "${RED}✗${NC} Frontend (port 3000): Not running"
fi

# Check backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend (port 3001): Running"
else
    echo -e "${RED}✗${NC} Backend (port 3001): Not running"
fi

# Check Minecraft bridge
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Minecraft Bridge (port 3002): Running"
else
    echo -e "${RED}✗${NC} Minecraft Bridge (port 3002): Not running"
fi

echo ""
echo "📍 Access URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   MC Bridge: http://localhost:3002"

