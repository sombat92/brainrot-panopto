# Minecraft Vertical Database - Usage Guide

## 🏗️ Architecture

Your Minecraft database now stores R2 file metadata in **two vertically organized regions**:

```
┌─────────────────────────────────────┐
│     LECTURES DATABASE               │ 
│     Y: 105-200 (95 blocks high)     │
│     Keys: lecture:*                 │
│                                     │
│  Stores: lecture metadata from R2   │
├─────────────────────────────────────┤
│     EMPTY BUFFER (Y: 101-104)       │
├─────────────────────────────────────┤
│     REELS DATABASE                  │
│     Y: 5-100 (95 blocks high)       │
│     Keys: reel:*                    │
│                                     │
│  Stores: reel metadata from R2      │
└─────────────────────────────────────┘
```

## 🚀 Getting Started

### 1. Start All Servers

```bash
# Terminal 1: Backend API (R2 storage)
cd backend
node index.js

# Terminal 2: Frontend (Python static server)
cd frontend
python3 -m http.server 3000

# Terminal 3: Minecraft Bridge (Database API)
cd minecraft-database/bridge-server
npm start

# Terminal 4: Minecraft Server (must be running with plugin)
# Start your Minecraft server with the MinecraftDatabase plugin
```

Or use the quick start script:
```bash
./start-servers.sh
```

### 2. Sync R2 Data to Minecraft

Once all servers are running, sync your R2 files to Minecraft:

```bash
node sync-to-minecraft.js
```

This will:
- Fetch all reels from R2 `reels/` folder
- Fetch all lectures from R2 `lectures/` folder
- Store metadata in Minecraft at the appropriate Y-levels
- Show progress and results

### 3. View What's Stored

Check what's in your Minecraft database:

```bash
node view-minecraft-db.js
```

This displays:
- All reels with metadata (from Y: 5-100)
- All lectures with metadata (from Y: 105-200)
- Database statistics

### 4. Access from Frontend

The frontend will automatically check if Minecraft bridge is available and load data:

1. Visit: http://localhost:3000
2. If Minecraft bridge is running, it loads dynamic data
3. If not available, it uses static fallback data

## 📡 API Endpoints

### Minecraft Bridge (Port 3002)

#### Core Operations
- `POST /mcdb/write` - Write arbitrary data
- `GET /mcdb/read/:key` - Read data by key
- `DELETE /mcdb/delete/:key` - Delete data
- `GET /mcdb/list` - List all keys
- `GET /mcdb/stats` - Get database statistics

#### Reel Operations (Y: 5-100)
- `POST /mcdb/reels/sync` - Sync R2 reels to Minecraft
- `GET /mcdb/reels/list` - List all reels
- `GET /mcdb/reels/:id` - Get specific reel

#### Lecture Operations (Y: 105-200)
- `POST /mcdb/lectures/sync` - Sync R2 lectures to Minecraft
- `GET /mcdb/lectures/list` - List all lectures
- `GET /mcdb/lectures/:id` - Get specific lecture

## 🎮 In-Game Visualization

To see your data in Minecraft:

1. **Join your Minecraft server**
2. **Teleport to database regions:**
   ```
   /tp @s 0 50 0    # View reels region (Y: 5-100)
   /tp @s 0 150 0   # View lectures region (Y: 105-200)
   ```
3. **Enable spectator mode to fly through:**
   ```
   /gamemode spectator
   ```

You'll see your data encoded as colored blocks!

## 📊 Data Format

### Reel Metadata
```json
{
  "id": "reel:filename.mp4",
  "r2_key": "reels/filename.mp4",
  "folder": "reels",
  "filename": "filename.mp4",
  "size": 4610871,
  "uploaded_at": "2025-11-01T14:22:56.555Z",
  "etag": "abc123...",
  "duration": 30,
  "views": 0,
  "likes": 0
}
```

### Lecture Metadata
```json
{
  "id": "lecture:DE_Intro_mp4",
  "r2_key": "lectures/DE Intro.mp4",
  "folder": "lectures",
  "filename": "DE Intro.mp4",
  "title": "Data Engineering Introduction",
  "module": "Data Engineering",
  "instructor": "Chris Rogers",
  "duration": "45:32",
  "size": 127890435,
  "uploaded_at": "2024-11-15T00:00:00.000Z",
  "description": "Introduction to data engineering..."
}
```

## 🔄 Workflow

### Adding New Reels/Lectures

1. **Upload to R2** (via backend API or manually)
   ```bash
   # Upload via upload.html
   # Or use R2 dashboard
   ```

2. **Sync to Minecraft**
   ```bash
   node sync-to-minecraft.js
   ```

3. **Frontend automatically loads** new data on next page load

### Updating Metadata

1. **Sync again** - syncing overwrites existing data
   ```bash
   node sync-to-minecraft.js
   ```

2. **Or update directly via API:**
   ```bash
   curl -X POST http://localhost:3002/mcdb/write \
     -H "Content-Type: application/json" \
     -d '{"key":"reel:video.mp4","value":"base64_encoded_json"}'
   ```

## 🛠️ Troubleshooting

### Bridge Server Won't Connect

**Error:** `Cannot connect to Minecraft Bridge`

**Solutions:**
1. Check Minecraft server is running
2. Verify plugin is loaded: `/plugins` in-game
3. Check bridge-server/.env has correct Minecraft host/port
4. Ensure socket port 25566 is open

### Sync Fails

**Error:** `Failed to sync reels/lectures`

**Solutions:**
1. Ensure backend API is running (port 3001)
2. Check R2 credentials in backend/.env
3. Verify Minecraft bridge is connected
4. Check for database capacity: `node view-minecraft-db.js`

### Frontend Shows Static Data

**Cause:** Minecraft bridge not available or offline

**Solutions:**
1. Start bridge server: `cd minecraft-database/bridge-server && npm start`
2. Verify connection: `curl http://localhost:3002/health`
3. Frontend gracefully falls back to static data if bridge unavailable

### Database Full

**Error:** `No available space in database!`

**Solutions:**
1. Check capacity: `curl http://localhost:3002/mcdb/stats`
2. Delete old entries: Use `/mcdb/delete/:key` endpoints
3. Or clear all: `curl -X DELETE http://localhost:3002/mcdb/clear` (if implemented)
4. Expand database region in config.yml

## 📈 Capacity Planning

Current configuration:
- **Area:** 4x4 chunks = 64×64 blocks
- **Reels region:** 95 blocks high = ~389,000 blocks
- **Lectures region:** 95 blocks high = ~389,000 blocks
- **Estimated capacity:** ~8,100 entries per region

This is enough for thousands of reels and lectures!

## 🎯 Best Practices

1. **Sync regularly** after uploading new content
2. **Monitor capacity** with view-minecraft-db.js
3. **Keep Minecraft server running** for persistence
4. **Backup your Minecraft world** regularly
5. **Use meaningful filenames** in R2 for better organization

## 🔐 Security

- Minecraft plugin uses authentication token (set in config.yml)
- Bridge server validates auth token on all commands
- Frontend cannot directly write to Minecraft (only read)
- Only sync script (or authorized tools) can write

## 🚦 Ports Summary

- **3000** - Frontend (Python static server)
- **3001** - Backend API (R2 operations)
- **3002** - Minecraft Bridge (database API)
- **25566** - Minecraft server socket (plugin)
- **25565** - Minecraft game server (default)

## 📚 Next Steps

- [Read DATABASE_REGIONS.md](./DATABASE_REGIONS.md) for architecture details
- [Check main README.md](../README.md) for project overview
- [View QUICKSTART.md](../QUICKSTART.md) for quick setup

---

**Need Help?** Check the logs:
- Backend: `/tmp/brainrot-backend.log`
- Minecraft Bridge: Console output
- Minecraft Plugin: Server logs

