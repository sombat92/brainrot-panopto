# 🎓 Brainrot Panopto

A modern lecture management system with Instagram-style reels, powered by Cloudflare R2 storage and Minecraft as a vertical database.

## ✨ Features

- 📹 **Instagram-style Reels** with three different popup themes
- 🎓 **Lecture Management** with video streaming from R2
- 🎮 **Minecraft Vertical Database** - Two database regions at different Y-levels
- ☁️ **Cloudflare R2 Storage** for all media files
- 🔄 **Auto-sync** from R2 to Minecraft database
- 📊 **Real-time Metadata** stored as colored blocks in Minecraft

## 🏗️ Architecture

### Three-Tier Stack

```
┌─────────────────────────────────────┐
│   Frontend (Python:3000)            │
│   HTML/CSS/JS static files          │
├─────────────────────────────────────┤
│   Backend API (Node.js:3001)        │
│   R2 Storage Operations             │
├─────────────────────────────────────┤
│   Minecraft Bridge (Node.js:3002)   │
│   Database API                      │
├─────────────────────────────────────┤
│   Minecraft Server (Socket:25566)   │
│   ┌─────────────────────┐           │
│   │ LECTURES (Y:105-200)│           │
│   ├─────────────────────┤           │
│   │ Buffer (Y:101-104)  │           │
│   ├─────────────────────┤           │
│   │ REELS (Y:5-100)     │           │
│   └─────────────────────┘           │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Python 3.8+
- Minecraft Server 1.20+
- Cloudflare R2 account

### 1. Install Dependencies

```bash
# Backend
cd backend && npm install

# Minecraft Bridge
cd minecraft-database/bridge-server && npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=brainrot-panopto
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. Start All Servers

```bash
# Easy way:
./start-servers.sh

# Or manually:
cd backend && node index.js &           # Port 3001
cd frontend && python3 -m http.server 3000 &  # Port 3000
cd minecraft-database/bridge-server && npm start &  # Port 3002
# Start your Minecraft server separately
```

### 4. Sync Data to Minecraft

```bash
node sync-to-minecraft.js
```

### 5. Access the App

- **Frontend:** http://localhost:3000
- **Viewer:** http://localhost:3000/viewer.html
- **Upload:** http://localhost:3000/upload.html

## 🎮 Minecraft Database

### Vertical Organization

Your Minecraft world stores metadata in two regions:

- **Reels:** Y 5-100 (reel:* keys)
- **Lectures:** Y 105-200 (lecture:* keys)

### View Your Data

```bash
# See what's stored
node view-minecraft-db.js

# Sync new files
node sync-to-minecraft.js

# In-game visualization
/tp @s 0 50 0    # Reels region
/tp @s 0 150 0   # Lectures region
/gamemode spectator
```

## 📡 API Reference

### Backend API (Port 3001)
- `GET /r2-health` - R2 connection status
- `GET /read-file` - Stream file from R2
- `POST /upload-file` - Upload to R2
- `GET /list-files` - List R2 files

### Minecraft Bridge (Port 3002)
- `POST /mcdb/reels/sync` - Sync reels to Minecraft
- `POST /mcdb/lectures/sync` - Sync lectures to Minecraft
- `GET /mcdb/reels/list` - List all reels
- `GET /mcdb/lectures/list` - List all lectures
- `GET /mcdb/stats` - Database statistics

## 📁 Project Structure

```
brainrot-panopto/
├── frontend/                  # Static files (Python serves)
│   ├── index.html            # Main page
│   ├── viewer.html           # Lecture viewer with reels
│   ├── scripts/              # JavaScript
│   │   ├── data.js          # Lecture/reel data
│   │   ├── minecraft-db.js  # Minecraft integration
│   │   └── viewer.js        # Video player
│   └── styles/               # CSS
│
├── backend/                   # R2 API server
│   ├── index.js              # Express server
│   └── package.json
│
├── minecraft-database/        # Database system
│   ├── plugin/               # Minecraft plugin (Java)
│   ├── bridge-server/        # HTTP API (Node.js)
│   ├── DATABASE_REGIONS.md   # Architecture docs
│   └── USAGE_GUIDE.md        # How to use
│
├── sync-to-minecraft.js       # Sync R2 → Minecraft
├── view-minecraft-db.js       # View database contents
├── start-servers.sh           # Startup script
└── ARCHITECTURE.md            # Full architecture
```

## 🔧 Configuration

### Minecraft Plugin

Edit `minecraft-database/plugin/src/main/resources/config.yml`:

```yaml
database:
  world: "world"
  chunks:
    start-x: 0
    start-z: 0
    end-x: 3
    end-z: 3
  storage:
    min-y: 5
    max-y: 250
```

### Capacity

- **Current:** ~8,100 entries per region
- **Total:** ~16,200 entries (reels + lectures)
- **Used:** Check with `node view-minecraft-db.js`

## 🎬 Reels Features

Three popup themes:
1. **Instagram Style** - Classic Instagram look
2. **iPhone Style** - iOS notch design
3. **Windows 95 Style** - Retro aesthetic

All reels:
- Auto-scroll with random intervals
- Auto-play when visible
- Draggable popups
- Social interaction buttons

## 📊 Data Flow

```
1. Upload → R2 Storage (Cloudflare)
2. Sync → Minecraft Database (Colored blocks)
3. Load → Frontend (via Bridge API)
4. Stream → Users (from R2)
```

## 🛠️ Development

### Add New Lecture

1. Upload MP4 to R2 `lectures/` folder
2. Run `node sync-to-minecraft.js`
3. Frontend auto-loads on next visit

### Add New Reel

1. Upload MP4 to R2 `reels/` folder
2. Run `node sync-to-minecraft.js`
3. Reels appear in viewer popups

## 🐛 Troubleshooting

### Reels Not Loading

1. Check backend API: `curl http://localhost:3001/r2-health`
2. Verify R2 credentials in `backend/.env`
3. Check browser console for errors

### Minecraft Database Empty

1. Ensure Minecraft server is running
2. Check bridge connection: `curl http://localhost:3002/health`
3. Run sync: `node sync-to-minecraft.js`

### Frontend Shows Static Data

This is normal! Frontend uses static fallback data when:
- Minecraft bridge is offline
- Initial page load (before dynamic load)
- Connection errors

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Quick setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [minecraft-database/USAGE_GUIDE.md](./minecraft-database/USAGE_GUIDE.md) - Database usage
- [minecraft-database/DATABASE_REGIONS.md](./minecraft-database/DATABASE_REGIONS.md) - Region details

## 🚦 Port Reference

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | Frontend | Static files (Python) |
| 3001 | Backend | R2 API (Node.js) |
| 3002 | Bridge | Minecraft API (Node.js) |
| 25566 | Plugin | Minecraft socket |
| 25565 | Game | Minecraft server |

## 🎯 Next Steps

1. ✅ Configure R2 credentials
2. ✅ Start all servers
3. ✅ Sync data to Minecraft
4. ✅ Visit http://localhost:3000
5. ✅ Upload new content
6. ✅ Watch it sync automatically!

## 🤝 Contributing

This project demonstrates:
- Modern web architecture
- Cloud storage integration
- Creative database usage (Minecraft!)
- Full-stack development

## 📄 License

MIT License - Use however you like!

---

**Made with 🎮 Minecraft, ☁️ Cloudflare R2, and ❤️ for creative solutions**
