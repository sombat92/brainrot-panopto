# 🚀 Brainrot Panopto - Quick Start Guide

## ✅ Current Status

Your project has been reorganized with **proper frontend/backend separation**!

## 📁 New Structure

```
brainrot-panopto/
├── frontend/          ← All HTML, CSS, JS, images (Python server)
├── backend/           ← API server for R2 storage (Node.js)
├── minecraft-database/ ← Minecraft database bridge (optional)
├── start-servers.sh   ← Easy startup script
└── stop-servers.sh    ← Easy stop script
```

## 🎯 What's Running

### ✅ Frontend Server (Port 3000)
- **Technology:** Python HTTP Server
- **Purpose:** Serves static HTML, CSS, JavaScript files
- **URL:** http://localhost:3000

### ✅ Backend API (Port 3001)
- **Technology:** Node.js + Express
- **Purpose:** Handles Cloudflare R2 file operations
- **URL:** http://localhost:3001
- **CORS:** Enabled for frontend access

### ✅ Minecraft Database Bridge (Port 3001)
- **Status:** Connected to Minecraft at localhost:25566
- **Purpose:** HTTP API for Minecraft database operations

## 🚀 Starting Everything

### Option 1: Use the startup script (Easiest!)
```bash
./start-servers.sh
```

### Option 2: Manual start
```bash
# Terminal 1 - Backend API
cd backend
node index.js

# Terminal 2 - Frontend
cd frontend
python3 -m http.server 3000

# Terminal 3 - Minecraft Bridge (optional)
cd minecraft-database/bridge-server
npm start
```

## 🛑 Stopping Servers

```bash
./stop-servers.sh
```

Or manually:
```bash
killall python3 node
```

## 🌐 Access Your App

- **Main Page:** http://localhost:3000/index.html
- **Viewer:** http://localhost:3000/viewer.html ✨
- **Login:** http://localhost:3000/login.html
- **Upload:** http://localhost:3000/upload.html
- **R2 Test:** http://localhost:3000/r2-test.html

## 🎬 Reels Are Working!

Your reels are stored in **Cloudflare R2** and streaming correctly:
- ✅ 3 reel videos found in R2
- ✅ Backend API streaming them properly
- ✅ Frontend receiving videos with CORS
- ✅ All 3 popup styles (Instagram, iPhone, Windows 95) work

## 🔧 Configuration

API calls automatically use the backend server:
- Frontend API URL: `http://localhost:3001`
- Configured in: `frontend/scripts/data.js`

## 📊 Architecture Benefits

1. **Clear Separation:** Frontend and backend are independent
2. **Easy Development:** Edit HTML/CSS/JS without restarting anything
3. **Python for Static Files:** No build process needed
4. **Node.js for APIs:** Full R2 integration with proper streaming
5. **Scalable:** Can deploy separately or add load balancers

## 📝 Common Tasks

### View Logs
```bash
# Backend logs
tail -f /tmp/brainrot-backend.log

# Frontend logs
tail -f /tmp/brainrot-frontend.log
```

### Test Backend API
```bash
# Health check
curl http://localhost:3001/r2-health

# List reels
curl http://localhost:3001/list-files?folder=reels
```

### Test Frontend
```bash
# Check if frontend is serving
curl http://localhost:3000/index.html
```

## 🎉 You're All Set!

Both servers are running and your reels are ready to play!

Visit: **http://localhost:3000/viewer.html**

---

For more details, see `ARCHITECTURE.md`

