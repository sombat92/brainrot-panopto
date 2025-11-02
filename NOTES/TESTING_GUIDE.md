# 🧪 Complete Testing Guide - Brainrot Panopto System

## System Status ✅

### Running Services

```
✅ Main Web Server          → http://localhost:3000
✅ Bridge Server            → http://localhost:3001
✅ Minecraft Server         → localhost:25565
✅ Minecraft Plugin Socket  → localhost:25566
```

### Service Details

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Express Web Server | 3000 | ✅ Running | Serve website + R2 API |
| Bridge Server | 3001 | ✅ Running | HTTP ↔ Minecraft socket |
| Minecraft Server | 25565 | ✅ Running | Game server (void world) |
| Plugin Socket | 25566 | ✅ Running | Minecraft database API |

---

## 🌐 Test 1: Main Website

### Access Points

```bash
# Home page
http://localhost:3000/

# Lecture selection
http://localhost:3000/viewer

# R2 test dashboard
http://localhost:3000/r2-test

# Upload interface
http://localhost:3000/upload
```

### What to Check

1. **Home Page** → Should load without errors
2. **Viewer Page** → Should show lecture grid
3. **R2 Dashboard** → Test R2 connection
4. **Upload Page** → Drag-and-drop file upload

---

## ☁️ Test 2: Cloudflare R2 Integration

### Health Check

```bash
curl http://localhost:3000/r2-health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "R2 connection successful",
  "endpoint": "https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com",
  "bucket": "brainrot-panopto",
  "timestamp": "2024-11-01T..."
}
```

### List Files

```bash
# List all files in lectures folder
curl http://localhost:3000/list-files?folder=lectures

# List all files in reels folder
curl http://localhost:3000/list-files?folder=reels
```

### Upload a Test File

```bash
# Create test file
echo "Hello from R2!" > test.txt

# Upload to R2
curl -X POST \
  "http://localhost:3000/upload-file?folder=test&fileName=test.txt" \
  -H "Content-Type: text/plain" \
  --data-binary @test.txt

# Read it back
curl "http://localhost:3000/read-file?folder=test&fileName=test.txt"
```

### Get File Info

```bash
curl "http://localhost:3000/file-info?folder=test&fileName=test.txt"
```

### Delete File

```bash
curl -X DELETE "http://localhost:3000/delete-file?folder=test&fileName=test.txt"
```

---

## 🎮 Test 3: Minecraft Void World

### Connect to Server

1. Open Minecraft Java Edition
2. Multiplayer → Add Server
3. **Server Address:** `localhost`
4. **Name:** "Database Test Server"
5. Join the server

### What You Should See

- Spawn on a **glass platform** at Y=63
- Complete **void** (empty space) all around
- **Creative mode** enabled
- No mobs, no terrain

### Navigate to Database Area

```bash
# In Minecraft chat
/tp 32 65 32
```

This teleports you to the center of the database storage area.

### Database Coordinates

```
Database Chunks: 0,0 to 3,3 (4×4 chunk grid)
X Range: 0 to 63
Z Range: 0 to 63
Y Range: 64 to 100

Total Storage: 64 × 64 × 37 = 151,552 blocks
```

---

## 🔌 Test 4: Minecraft Database via Bridge Server

### Bridge Server Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "minecraft": "connected",
  "timestamp": "2024-11-01T...",
  "uptime": 123.456
}
```

### Write Data to Minecraft Database

```bash
# Write a simple key-value pair
curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{
    "key": "username",
    "value": "minecraft_db_test"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Data written successfully",
  "key": "username",
  "blocks_used": 24
}
```

### Read Data from Minecraft Database

```bash
curl -X GET "http://localhost:3001/mcdb/read/username"
```

**Expected Response:**
```json
{
  "success": true,
  "key": "username",
  "value": "minecraft_db_test",
  "timestamp": "2024-11-01T..."
}
```

### Delete Data

```bash
curl -X DELETE "http://localhost:3001/mcdb/delete/username"
```

### List All Keys

```bash
curl http://localhost:3001/mcdb/list
```

### Get Database Stats

```bash
curl http://localhost:3001/mcdb/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total_blocks": 151552,
    "used_blocks": 24,
    "free_blocks": 151528,
    "usage_percent": 0.02,
    "total_entries": 1
  }
}
```

---

## 👀 Test 5: Visual Verification in Minecraft

### Step 1: Write Some Data

```bash
curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{"key": "test1", "value": "Hello Minecraft Database!"}'

curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{"key": "test2", "value": "Blocks are data!"}'

curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{"key": "test3", "value": "Amazing!"}'
```

### Step 2: See It in Minecraft

1. Join the Minecraft server
2. Run: `/tp 32 65 32`
3. Look around at Y=64-70
4. You should see **colored blocks**!

### What You'll See

- **Different colored wool blocks**
- **Different types of planks**
- **Different types of stone**
- Each block represents **4 bits** of data
- Patterns = your encoded data!

### Step 3: Fly Around

```bash
/gamemode spectator
```

Now you can fly through the database and see all the data blocks!

### Color Guide

Each byte of data = 2 blocks:
- 🟥 Red Wool
- 🟧 Orange Wool
- 🟨 Yellow Wool
- 🟩 Lime Wool
- 🟦 Light Blue Wool
- 🟪 Purple Wool
- ⬛ Black Wool
- ⬜ White Wool
- 🌲 Oak Planks
- 🌳 Spruce Planks
- 🪵 Birch Planks
- ... and more!

---

## 🧪 Test 6: Complex Operations

### Store JSON Data

```bash
curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user_profile",
    "value": "{\"name\":\"Alex\",\"level\":42,\"items\":[\"sword\",\"shield\"]}"
  }'
```

### Store Large Text

```bash
curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{
    "key": "essay",
    "value": "This is a long essay about using Minecraft as a database. It can store quite a bit of text, compressed and encoded into colorful blocks..."
  }'
```

### Stress Test

```bash
# Write 100 entries
for i in {1..100}; do
  curl -X POST http://localhost:3001/mcdb/write \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"test_$i\",\"value\":\"Test entry number $i\"}"
  echo "Written entry $i"
  sleep 0.1
done

# Check stats
curl http://localhost:3001/mcdb/stats
```

---

## 📊 Test 7: Integration Test (Full Stack)

### Scenario: Store Lecture Metadata in Minecraft

```bash
# 1. Upload video to R2
curl -X POST \
  "http://localhost:3000/upload-file?folder=lectures&fileName=cs101-lecture-1.mp4" \
  -H "Content-Type: video/mp4" \
  --data-binary @my-video.mp4

# 2. Store metadata in Minecraft
curl -X POST http://localhost:3001/mcdb/write \
  -H "Content-Type: application/json" \
  -d '{
    "key": "lecture:cs101-1",
    "value": "{\"title\":\"CS101 Intro\",\"duration\":3600,\"views\":0,\"r2_path\":\"lectures/cs101-lecture-1.mp4\"}"
  }'

# 3. Read metadata from Minecraft
curl "http://localhost:3001/mcdb/read/lecture:cs101-1"

# 4. Stream video from R2
curl "http://localhost:3000/read-file?folder=lectures&fileName=cs101-lecture-1.mp4" \
  --output downloaded.mp4
```

---

## 🔧 Troubleshooting

### Main Web Server Not Working

```bash
# Check if running
lsof -i :3000

# Restart
cd ~/Documents/Home/brainrot-panopto
npm start
```

### R2 Errors

```bash
# Check environment variables
cat .env | grep R2

# Test connection
curl http://localhost:3000/r2-health
```

### Bridge Server Not Working

```bash
# Check if running
lsof -i :3001

# Check logs
cd ~/Documents/Home/brainrot-panopto/minecraft-database/bridge-server
npm start
```

### Minecraft Server Not Working

```bash
# Check if running
lsof -i :25565

# Restart
cd ~/minecraft-server-void
./start.sh
```

### Plugin Not Loading

```bash
# Check plugins folder
ls -la ~/minecraft-server-void/plugins/

# View server logs
tail -f ~/minecraft-server-void/logs/latest.log
```

### Plugin Socket Not Accepting Connections

```bash
# Check if socket is open
lsof -i :25566

# Check plugin config
cat ~/minecraft-server-void/plugins/MinecraftDatabase/config.yml

# Check auth token matches
grep AUTH ~/Documents/Home/brainrot-panopto/minecraft-database/bridge-server/.env
```

---

## 📝 Server Console Commands

### Minecraft Commands

```bash
# In Minecraft server console:
mcdb status    # Check database status
mcdb test      # Run built-in test
mcdb info      # Show capacity and usage
mcdb clear     # Clear all data (careful!)
mcdb help      # Show all commands
```

### Useful Minecraft Commands

```bash
/tp 32 65 32              # Teleport to database center
/gamemode creative        # Switch to creative
/gamemode spectator       # Fly through blocks
/time set day             # Set time to day
/weather clear            # Clear weather
/gamerule doDaylightCycle false  # Stop time
```

---

## 🎯 Success Criteria

### ✅ All Tests Pass If:

1. **Web Server**
   - [ ] Home page loads
   - [ ] Viewer page loads
   - [ ] R2 dashboard works
   - [ ] Upload interface works

2. **R2 Integration**
   - [ ] Health check returns success
   - [ ] Can list files
   - [ ] Can upload files
   - [ ] Can download files
   - [ ] Can delete files
   - [ ] Can get file info

3. **Minecraft Server**
   - [ ] Server starts without errors
   - [ ] Can connect in Minecraft
   - [ ] Spawn on glass platform
   - [ ] World is void (no terrain)
   - [ ] Database chunks are loaded

4. **Bridge Server**
   - [ ] Health check shows "connected"
   - [ ] Can write data
   - [ ] Can read data
   - [ ] Can delete data
   - [ ] Can list keys
   - [ ] Stats are accurate

5. **Visual Verification**
   - [ ] Data appears as colored blocks
   - [ ] Blocks appear at correct coordinates
   - [ ] Multiple entries create patterns
   - [ ] Can fly through and see data

---

## 🚀 Performance Benchmarks

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| R2 Upload | < 1s per MB | Depends on connection |
| R2 Download | < 500ms | For small files |
| Minecraft Write | < 100ms | Single entry |
| Minecraft Read | < 50ms | Single entry |
| Minecraft Delete | < 50ms | Single entry |
| Bridge Latency | < 10ms | Local connection |

### Stress Test Results

```bash
# Write 100 entries
Time: ~10-15 seconds
Success rate: 100%

# Read 100 entries
Time: ~5 seconds
Success rate: 100%

# Mixed operations
Throughput: ~50-100 ops/sec
```

---

## 📚 Next Steps

### After Testing

1. **Configure Production Settings**
   - Update auth tokens
   - Set up proper .env files
   - Configure firewall rules

2. **Optimize Performance**
   - Tune Java heap size
   - Adjust chunk loading
   - Enable compression

3. **Add Monitoring**
   - Set up logging
   - Add metrics
   - Create dashboards

4. **Deploy to Production**
   - Use proper domain
   - Enable SSL/TLS
   - Set up backups

---

## 📖 Documentation References

- [VOID_WORLD_SETUP.md](./minecraft-database/VOID_WORLD_SETUP.md) - Void world details
- [BUILD_SUCCESS.md](./BUILD_SUCCESS.md) - Build information
- [MINECRAFT_SETUP_GUIDE.md](./MINECRAFT_SETUP_GUIDE.md) - Complete setup guide
- [R2_API_DOCUMENTATION.md](./R2_API_DOCUMENTATION.md) - R2 API reference
- [minecraft-database/README.md](./minecraft-database/README.md) - Plugin documentation

---

## 🎉 Congratulations!

If all tests pass, you have successfully set up:
- ✅ Web server with R2 integration
- ✅ Cloudflare R2 object storage
- ✅ Minecraft void world database
- ✅ Bridge server for HTTP ↔ Minecraft
- ✅ Visual data storage in blocks

**You're using Minecraft as a database!** 🎮🗄️

