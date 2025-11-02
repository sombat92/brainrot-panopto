# 📊 Complete Data Flow: R2 → Minecraft → Frontend

## 🔄 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE R2 STORAGE                        │
│                  (Source of Truth for Files)                    │
│                                                                 │
│  📁 Bucket: brainrot-panopto                                    │
│     ├── reels/                                                  │
│     │   ├── reel1.mp4 (4.6 MB)                                 │
│     │   ├── reel2.mp4 (1.2 MB)                                 │
│     │   └── reel3.mp4 (0.7 MB)                                 │
│     └── lectures/                                               │
│         └── DE Intro.mp4 (127 MB)                              │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ ① Sync Process (node sync-to-minecraft.js)
             │    - Fetches file list from R2
             │    - Extracts metadata (path, size, date)
             │
             ↓
┌────────────┴────────────────────────────────────────────────────┐
│               MINECRAFT DATABASE (Vertical Regions)             │
│                 (Metadata Storage as Blocks)                    │
│                                                                 │
│  🎮 World: world, Chunks: 0,0 to 3,3 (4×4)                     │
│                                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │  LECTURES DATABASE (Y: 105-200)          │                  │
│  │  Keys: lecture:*                         │                  │
│  │                                          │                  │
│  │  Stored as colored blocks:               │                  │
│  │  🟦🟨🟪🟩🟥🟧 = JSON metadata           │                  │
│  │                                          │                  │
│  │  Example data:                           │                  │
│  │  {                                       │                  │
│  │    "r2_key": "lectures/DE Intro.mp4",    │                  │
│  │    "folder": "lectures",                 │                  │
│  │    "filename": "DE Intro.mp4",           │                  │
│  │    "size": 127890435,                    │                  │
│  │    "title": "Data Engineering Intro"     │                  │
│  │  }                                       │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │  BUFFER ZONE (Y: 101-104) - Empty        │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │  REELS DATABASE (Y: 5-100)               │                  │
│  │  Keys: reel:*                            │                  │
│  │                                          │                  │
│  │  Stored as colored blocks:               │                  │
│  │  🔴🟠🟡🟢🔵🟣 = JSON metadata            │                  │
│  │                                          │                  │
│  │  Example data:                           │                  │
│  │  {                                       │                  │
│  │    "r2_key": "reels/reel1.mp4",          │                  │
│  │    "folder": "reels",                    │                  │
│  │    "filename": "reel1.mp4",              │                  │
│  │    "size": 4610871,                      │                  │
│  │    "views": 0, "likes": 0                │                  │
│  │  }                                       │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ ② Query Process (Frontend on page load)
             │    - Fetches metadata from Minecraft
             │    - Gets R2 paths from stored JSON
             │
             ↓
┌────────────┴────────────────────────────────────────────────────┐
│                  MINECRAFT BRIDGE API (Port 3002)               │
│                     (HTTP ↔ Socket Adapter)                     │
│                                                                 │
│  📡 Endpoints:                                                  │
│     GET /mcdb/reels/list                                        │
│         → Queries Minecraft for all reel:* keys                 │
│         → Returns: [{r2_key, folder, filename, ...}]            │
│                                                                 │
│     GET /mcdb/lectures/list                                     │
│         → Queries Minecraft for all lecture:* keys              │
│         → Returns: [{r2_key, folder, filename, ...}]            │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ ③ Data Transformation (minecraft-db.js)
             │    - Receives metadata from Minecraft
             │    - Constructs video URLs
             │
             ↓
┌────────────┴────────────────────────────────────────────────────┐
│                   FRONTEND (Browser - Port 3000)                │
│                                                                 │
│  📄 Page Load:                                                  │
│     1. minecraft-db.js calls:                                   │
│        fetch('http://localhost:3002/mcdb/reels/list')           │
│                                                                 │
│     2. Receives Minecraft data:                                 │
│        [{                                                       │
│          r2_key: "reels/reel1.mp4",                            │
│          folder: "reels",                                       │
│          filename: "reel1.mp4"                                 │
│        }]                                                       │
│                                                                 │
│     3. Constructs video URLs:                                   │
│        const videoUrl = `${API_BASE_URL}/read-file              │
│          ?folder=${folder}&fileName=${filename}`;               │
│                                                                 │
│        Result: "http://localhost:3001/read-file                 │
│                ?folder=reels&fileName=reel1.mp4"                │
│                                                                 │
│     4. Replaces static data:                                    │
│        reelsData.push({                                         │
│          id: "reel:reels/reel1.mp4",                           │
│          video: videoUrl,  // ← From Minecraft!                 │
│          ...metadata                                            │
│        });                                                      │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ ④ Video Streaming (User clicks play)
             │    - Browser requests video from constructed URL
             │    - Backend proxies request to R2
             │
             ↓
┌────────────┴────────────────────────────────────────────────────┐
│               BACKEND API (Node.js - Port 3001)                 │
│                    (R2 Proxy + CORS Handler)                    │
│                                                                 │
│  🔗 GET /read-file?folder=reels&fileName=reel1.mp4             │
│                                                                 │
│     1. Receives request from frontend                           │
│     2. Constructs R2 key: "reels/reel1.mp4"                    │
│     3. Calls R2 API with AWS SDK:                              │
│        s3.send(new GetObjectCommand({                           │
│          Bucket: "brainrot-panopto",                            │
│          Key: "reels/reel1.mp4"                                │
│        }))                                                      │
│     4. Streams response back to frontend                        │
│     5. Sets proper Content-Type headers                         │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ ⑤ File Delivery (R2 streams to user)
             │    - Backend pipes R2 stream to browser
             │    - Browser plays video
             │
             ↓
┌────────────┴────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                    (Video Player in viewer.html)                │
│                                                                 │
│  🎬 <video> tag:                                                │
│     <video src="http://localhost:3001/read-file                 │
│                 ?folder=reels&fileName=reel1.mp4">              │
│                                                                 │
│     Video streams → Buffer → Playback                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Detailed Flow Steps

### Step 1: Sync R2 to Minecraft
```bash
$ node sync-to-minecraft.js
```

**What happens:**
1. Script calls Backend API: `GET /list-files?folder=reels`
2. Backend queries R2 using AWS SDK
3. R2 returns file list with metadata
4. Script calls Minecraft Bridge: `POST /mcdb/reels/sync`
5. Bridge encodes metadata as base64 JSON
6. Minecraft plugin writes data as colored blocks at Y: 5-100
7. Each file = one key in Minecraft (e.g., `reel:reels/reel1.mp4`)

**Data stored in Minecraft:**
```json
{
  "id": "reel:reels/reel1.mp4",
  "r2_key": "reels/reel1.mp4",      ← Critical: R2 location!
  "folder": "reels",                 ← Used to construct URL
  "filename": "reel1.mp4",           ← Used to construct URL
  "size": 4610871,
  "uploaded_at": "2025-11-01T14:22:56.555Z",
  "etag": "bd5b3c595b8e6405a59cfe9e7207a702"
}
```

### Step 2: Frontend Queries Minecraft
```javascript
// In minecraft-db.js, runs on page load
const response = await fetch('http://localhost:3002/mcdb/reels/list');
const data = await response.json();
```

**What happens:**
1. Browser calls Minecraft Bridge API
2. Bridge sends socket command to Minecraft plugin
3. Plugin scans database for keys starting with `reel:`
4. Plugin reads colored blocks, decodes to JSON
5. Bridge returns array of reel metadata
6. Frontend receives all R2 file paths!

### Step 3: Construct Video URLs
```javascript
// Transform Minecraft data to frontend format
const videoUrl = `${API_BASE_URL}/read-file?folder=${reel.folder}&fileName=${reel.filename}`;

// Result:
// "http://localhost:3001/read-file?folder=reels&fileName=reel1.mp4"
```

**Critical insight:** The URL is built using `folder` and `filename` that came from Minecraft, which originally came from R2!

### Step 4: User Plays Video
```html
<video src="http://localhost:3001/read-file?folder=reels&fileName=reel1.mp4">
```

**What happens:**
1. Browser requests video from Backend API
2. Backend extracts: folder="reels", fileName="reel1.mp4"
3. Backend constructs R2 key: "reels/reel1.mp4"
4. Backend calls R2 with AWS SDK
5. R2 streams file data
6. Backend pipes stream to browser
7. Video plays!

## 🎯 Key Points

### 1. **R2 is Source of Truth**
- Actual video files live in R2
- R2 paths are stored in Minecraft
- Frontend never hardcodes paths

### 2. **Minecraft Stores Metadata**
- File paths (r2_key, folder, filename)
- File size, upload date, etag
- Custom metadata (views, likes, title)
- All encoded as colored blocks!

### 3. **Frontend is Dynamic**
- Queries Minecraft on page load
- Gets fresh file list every time
- Falls back to static data if Minecraft offline

### 4. **Backend is a Proxy**
- Handles CORS
- Proxies R2 requests
- Provides authentication layer

## 📊 URL Construction Chain

```
R2 Storage Path:
  reels/AQMLV-yAiIf9wDEIPXQh...mp4

     ↓ (stored in Minecraft)

Minecraft Key:
  reel:reels/AQMLV-yAiIf9wDEIPXQh...mp4

Minecraft JSON:
  {
    "folder": "reels",
    "filename": "AQMLV-yAiIf9wDEIPXQh...mp4"
  }

     ↓ (queried by frontend)

Frontend URL:
  http://localhost:3001/read-file?folder=reels&fileName=AQMLV-yAiIf9wDEIPXQh...mp4

     ↓ (proxied by backend)

R2 SDK Call:
  GetObjectCommand({
    Bucket: "brainrot-panopto",
    Key: "reels/AQMLV-yAiIf9wDEIPXQh...mp4"
  })

     ↓ (streamed to user)

User's Browser:
  <video> plays the file!
```

## 🧪 Testing the Flow

```bash
# Test complete flow
node test-minecraft-flow.js
```

**This script verifies:**
1. ✅ R2 files are accessible
2. ✅ Files sync to Minecraft correctly
3. ✅ Minecraft stores R2 paths
4. ✅ Frontend can query Minecraft
5. ✅ Video URLs work end-to-end

## 🎮 Visual Verification

### In Minecraft:
```
/tp @s 0 50 0        # Fly to reels database
/gamemode spectator
```

You'll see colored blocks! Each unique color pattern represents part of the JSON metadata containing the R2 path.

### In Browser Console:
```
Open http://localhost:3000/viewer.html
Check console for:
  "🎮 Querying Minecraft database for reels (Y: 5-100)..."
  "✅ Retrieved 3 reels from Minecraft database"
  "📹 Reel: reel1.mp4 → http://localhost:3001/read-file?..."
```

## ⚡ Performance

- **Minecraft Query:** ~50-100ms (local network)
- **R2 Stream Setup:** ~100-200ms (first byte)
- **Total Overhead:** ~150-300ms
- **Caching:** Browser caches video chunks
- **Result:** Smooth playback after initial load

## 🔒 Security

1. **R2 Credentials:** Only backend has access
2. **Minecraft Auth:** Plugin requires auth token
3. **CORS:** Backend only allows localhost:3000
4. **No Direct R2 Access:** Frontend can't bypass backend

## 🎓 Summary

**Your data flows through THREE layers:**

1. **Storage:** R2 holds actual files
2. **Index:** Minecraft stores file locations as blocks
3. **Access:** Frontend queries Minecraft, streams from R2

This architecture gives you:
- ✅ **Persistence:** Minecraft world = permanent database
- ✅ **Flexibility:** Easy to add/remove files
- ✅ **Visibility:** See your data as colored blocks
- ✅ **Scalability:** Can handle thousands of files
- ✅ **Fun:** It's literally a Minecraft database! 🎮

---

**Need to verify it's working?**
```bash
node test-minecraft-flow.js
```

**This proves your frontend is querying Minecraft to get R2 file locations!**

