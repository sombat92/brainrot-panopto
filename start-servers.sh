#!/bin/bash

# Brainrot Panopto Server Startup Script
# This script starts all required servers

echo "╔════════════════════════════════════════════╗"
echo "║    Starting Brainrot Panopto Servers      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on a port
kill_port() {
    echo "⚠️  Port $1 is already in use. Stopping existing process..."
    lsof -ti:$1 | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check and kill existing processes
if check_port 3000; then
    kill_port 3000
fi

if check_port 3001; then
    kill_port 3001
fi

echo "Starting servers..."
echo ""

# Start Backend API Server (Port 3001)
echo "1️⃣  Starting Backend API Server (Node.js on port 3001)..."
cd "$SCRIPT_DIR/backend"
node index.js > /tmp/brainrot-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Check if backend started successfully
if check_port 3001; then
    echo "   ✅ Backend API running on http://localhost:3001"
else
    echo "   ❌ Failed to start backend API"
    cat /tmp/brainrot-backend.log
    exit 1
fi

echo ""

# Start Frontend Server (Port 3000)
echo "2️⃣  Starting Frontend Server (Python on port 3000)..."
cd "$SCRIPT_DIR/frontend"
python3 -m http.server 3000 > /tmp/brainrot-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Check if frontend started successfully
if check_port 3000; then
    echo "   ✅ Frontend running on http://localhost:3000"
else
    echo "   ❌ Failed to start frontend"
    cat /tmp/brainrot-frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""

# Optional: Start Minecraft Bridge Server
echo "3️⃣  Minecraft Bridge Server (optional)..."
if [ -f "$SCRIPT_DIR/minecraft-database/bridge-server/server.js" ]; then
    read -p "   Start Minecraft database bridge? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$SCRIPT_DIR/minecraft-database/bridge-server"
        node server.js > /tmp/brainrot-minecraft-bridge.log 2>&1 &
        BRIDGE_PID=$!
        sleep 2
        echo "   ✅ Minecraft bridge started"
    else
        echo "   ⏭️  Skipping Minecraft bridge"
    fi
else
    echo "   ⚠️  Minecraft bridge not found, skipping"
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║          🚀 All Servers Running!          ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000          ║"
echo "║  Backend:   http://localhost:3001          ║"
echo "║  Viewer:    http://localhost:3000/viewer.html ║"
echo "╠════════════════════════════════════════════╣"
echo "║  Logs:                                     ║"
echo "║  - Backend:  /tmp/brainrot-backend.log     ║"
echo "║  - Frontend: /tmp/brainrot-frontend.log    ║"
echo "╠════════════════════════════════════════════╣"
echo "║  To stop: killall python3 node             ║"
echo "║  Or run: ./stop-servers.sh                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all servers and exit"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping all servers...'; kill $BACKEND_PID $FRONTEND_PID $BRIDGE_PID 2>/dev/null; exit 0" INT TERM

# Keep script running
wait

