#!/bin/bash

# Brainrot Panopto Server Stop Script

echo "🛑 Stopping Brainrot Panopto servers..."

# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Stopped frontend (port 3000)"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✅ Stopped backend (port 3001)"

echo "✅ All servers stopped"

