# 🏗️ Brainrot Panopto - System Architecture

## 📊 High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE R2                            │
│              (Object Storage - Videos)                      │
│                                                             │
│  📹 /reels/*.mp4  +  🎓 /lectures/*.mp4                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Metadata Sync
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            MINECRAFT DATABASE (Colored Blocks)              │
│                                                             │
│  Y: 201-250  │ 📝 Notes (per-lecture user notes)          │
│  Y: 105-200  │ 🎓 Lectures (metadata + R2 paths)          │
│  Y: 101-104  │ ─── Buffer Zone ───                        │
│  Y: 5-100    │ 📹 Reels (metadata + R2 paths + brainrot)  │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Socket Protocol (port 25566)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│          MINECRAFT BRIDGE SERVER (Node.js:3002)             │
│                                                             │
│  • HTTP → Socket translation                               │
│  • REST API endpoints                                      │
│  • Brainrot metadata assignment                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP API
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         BACKEND API SERVER (Node.js:3001)                   │
│                                                             │
│  • R2 file operations (read/upload/list/delete)            │
│  • Proxy for video streaming                               │
│  • CORS enabled for frontend                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Requests
                       ↓
┌─────────────────────────────────────────────────────────────┐
│        FRONTEND (Python HTTP Server:3000)                   │
│                                                             │
│  • Static file serving (HTML/CSS/JS)                       │
│  • Lecture viewer                                          │
│  • Reels popup (with brainrot metadata)                    │
│  • Notes panel (auto-save to Minecraft)                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Frontend (Static Files)
**Location:** `frontend/`  
**Server:** Python `http.server` on port 3000  
**Files:**
- `index.html` - Lecture selection page
- `viewer.html` - Main viewer with video player, reels, notes
- `upload.html` - File upload interface
- `scripts/` - JavaScript modules
  - `data.js` - Static lecture data
  - `minecraft-db.js` - Minecraft integration
  - `notes-autosave.js` - Auto-save notes to Minecraft
  - `viewer.js` - Main viewer logic
  - `functions.js` - Utility functions

### 2. Backend API (Node.js)
**Location:** `backend/`  
**Server:** Node.js Express on port 3001  
**Purpose:** Cloudflare R2 integration  
**Endpoints:**
- `GET /r2-health` - Check R2 connection
- `GET /read-file` - Stream file from R2
- `POST /upload-file` - Upload file to R2
- `GET /list-files` - List files in folder
- `DELETE /delete-file` - Delete file from R2
- `GET /file-info` - Get file metadata

### 3. Minecraft Database
**Location:** `minecraft-database/`  
**Components:**
- **Java Plugin** (`plugin/`) - Minecraft server plugin
  - Stores data as colored blocks
  - Socket server on port 25566
  - GZIP compression
  - 256-block encoding (1 block = 1 byte)
- **Bridge Server** (`bridge-server/`) - HTTP ↔ Socket translator
  - Node.js Express on port 3002
  - REST API for database operations
  - Brainrot metadata assignment

**Vertical Database Regions:**
```
Y=250 ┌──────────────────┐
      │ NOTES            │ 📝 User notes per lecture
Y=201 ├──────────────────┤    Key: note:{userId}_{lectureId}
      │                  │
Y=200 │ LECTURES         │ 🎓 Lecture metadata + R2 paths
      │                  │    Key: lecture:{filename}
Y=105 ├──────────────────┤
Y=104 │ BUFFER (empty)   │
Y=101 ├──────────────────┤
Y=100 │ REELS            │ 📹 Reel metadata + R2 paths
      │                  │    + brainrot usernames/descriptions
Y=5   └──────────────────┘    Key: reel:{r2_key}
```

### 4. Admin Scripts
**Location:** `admin/`  
**Purpose:** Server management and setup (not deployed)

**Scripts:**
- `bulk-upload-reels.js` - Batch upload reels from folder
- `sync-to-minecraft.js` - Sync R2 metadata to Minecraft
- `view-minecraft-db.js` - View Minecraft database contents
- `test-brainrot-metadata.js` - Test brainrot system
- `test-minecraft-flow.js` - Test complete data flow
- `brainrot-content-generator.js` - Generate brainrot metadata

## 🔄 Data Flow Examples

### Example 1: Uploading Reels

```
Admin runs: node admin/bulk-upload-reels.js ./my-reels
         ↓
1. Scan folder for videos (.mp4, .mov, etc.)
         ↓
2. Upload each to R2 via Backend API (port 3001)
         ↓
3. Fetch uploaded files list from R2
         ↓
4. Send to Minecraft Bridge (port 3002) /mcdb/reels/sync
         ↓
5. Bridge assigns brainrot username + description
         ↓
6. Write to Minecraft database (Y: 5-100) as colored blocks
         ↓
✅ Done! View at http://localhost:3000/viewer.html
```

### Example 2: Watching Video with Notes

```
User opens viewer.html
         ↓
1. Frontend queries Minecraft Bridge: GET /mcdb/reels/list
         ↓
2. Bridge reads from Minecraft (Y: 5-100)
         ↓
3. Returns metadata (filename, folder, username, description)
         ↓
4. Frontend constructs R2 URL: http://localhost:3001/read-file?folder=reels&fileName=...
         ↓
5. Backend API streams video from R2 to browser
         ↓
6. User takes notes in left panel
         ↓
7. After 2 seconds, notes-autosave.js triggers
         ↓
8. POST /mcdb/notes/save → Minecraft Bridge
         ↓
9. Bridge writes to Minecraft (Y: 201-250)
         ↓
✅ Notes saved as colored blocks!
```

### Example 3: Viewing Reels Popup

```
User clicks "Reels" button
         ↓
1. Popup opens with reels from minecraft-db.js loaded data
         ↓
2. Each reel shows:
   - Username (@ohio_rizz_lord)
   - Description ("only in ohio bruh 💀")
   - Random views/likes
         ↓
3. As reels scroll, footer updates dynamically
         ↓
4. Video streams from R2 via Backend API
```

## 🗂️ Directory Structure

```
brainrot-panopto/
├── admin/                          # 🔧 Admin scripts (not deployed)
│   ├── bulk-upload-reels.js
│   ├── sync-to-minecraft.js
│   ├── view-minecraft-db.js
│   ├── test-brainrot-metadata.js
│   ├── test-minecraft-flow.js
│   └── brainrot-content-generator.js
│
├── frontend/                       # 🎨 Static frontend files
│   ├── index.html
│   ├── viewer.html
│   ├── upload.html
│   ├── r2-test.html
│   ├── scripts/
│   │   ├── data.js
│   │   ├── minecraft-db.js
│   │   ├── notes-autosave.js
│   │   ├── viewer.js
│   │   ├── functions.js
│   │   └── lecture-selection.js
│   └── styles/
│       ├── main.css
│       ├── viewer.css
│       ├── lecture-selection.css
│       └── login.css
│
├── backend/                        # ⚙️ Backend API server
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── minecraft-database/             # 🎮 Minecraft database system
│   ├── plugin/                     # Java Minecraft plugin
│   │   ├── src/main/java/...
│   │   ├── pom.xml
│   │   └── target/
│   │       └── MinecraftDatabase-1.0.0.jar
│   │
│   ├── bridge-server/              # Node.js HTTP bridge
│   │   ├── server.js
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   ├── DATABASE_REGIONS.md
│   ├── NOTES_DATABASE.md
│   ├── ENCODING_OPTIMIZATION.md
│   └── README.md
│
├── NOTES/                          # 📚 Documentation
│   └── ... (all other docs)
│
├── start-servers.sh                # 🚀 Start all servers
├── stop-servers.sh                 # 🛑 Stop all servers
├── package.json                    # Legacy (kept for compatibility)
├── .env                            # Environment variables
└── README.md                       # Main readme
```

## 🧠 Brainrot Metadata System

### Concept
Each reel gets a **unique brainrot-themed identity**:
- Username (e.g., `ohio_rizz_lord`, `sigma_grindset`)
- Description (e.g., "caught lacking in 4k ultra hd 📸")

### Assignment Method
**Deterministic based on filename hash:**
```javascript
const hash = computeHash(filename);
const usernameIndex = hash % BRAINROT_USERNAMES.length;
const descriptionIndex = (hash >> 16) % BRAINROT_DESCRIPTIONS.length;
```

**Result:** Same file always gets same metadata!

### Storage
Stored in Minecraft database as JSON:
```json
{
  "id": "reel:reels/video.mp4",
  "filename": "video.mp4",
  "folder": "reels",
  "r2_key": "reels/video.mp4",
  "size": 5242880,
  "views": 456789,
  "likes": 23456,
  "username": "mewing_mogger",
  "description": "gyatt damn this is bussin fr fr no cap 🧢"
}
```

### Content Pool
- **112 usernames** (skibidi_sigma, ohio_rizz_lord, rust_evangelist, etc.)
- **102 descriptions** (brainrot-themed captions)
- **11,424 unique combinations**

## 🔐 Security & Configuration

### Environment Variables (`.env`)
```bash
# Cloudflare R2
R2_ENDPOINT=https://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Minecraft Database
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25566
MINECRAFT_AUTH_TOKEN=your-secret-token
BRIDGE_PORT=3002
```

### CORS Configuration
Backend API allows requests from:
- `http://localhost:3000` (frontend)

## 🚀 Deployment

### Start All Servers
```bash
./start-servers.sh
```

**Starts:**
1. Python HTTP server (port 3000) - Frontend
2. Node.js Backend API (port 3001) - R2 operations
3. Node.js Minecraft Bridge (port 3002) - Database API

### Stop All Servers
```bash
./stop-servers.sh
```

### Minecraft Server
Must be running separately with:
- MinecraftDatabase plugin installed
- Socket server enabled on port 25566
- Void world loaded

## 📊 Performance Characteristics

### Minecraft Database
- **Encoding:** 256 blocks (1 block = 1 byte)
- **Compression:** GZIP
- **Capacity per region:**
  - Reels (Y 5-100): ~1 MB, ~2000 entries
  - Lectures (Y 105-200): ~1 MB, ~1200 entries
  - Notes (Y 201-250): ~200 KB, ~100 notes

### Video Streaming
- **Method:** Proxied through Backend API
- **Source:** Cloudflare R2 (CDN-backed)
- **Bandwidth:** Depends on R2 plan
- **Latency:** Low (CDN edge caching)

## 🎯 Key Features

1. **Minecraft as Database** - Store metadata as colored blocks
2. **Vertical Organization** - Three database regions (reels, lectures, notes)
3. **Brainrot Metadata** - Unique usernames/descriptions per reel
4. **Auto-Save Notes** - Notes saved to Minecraft every 2 seconds
5. **Bulk Upload** - Upload multiple reels at once
6. **Deterministic Metadata** - Same file = same identity
7. **R2 Integration** - Scalable video storage
8. **Efficient Encoding** - 256-block palette (1 block = 1 byte)

## 🔧 Admin Operations

### Upload Reels
```bash
node admin/bulk-upload-reels.js /path/to/reels
```

### Sync R2 to Minecraft
```bash
node admin/sync-to-minecraft.js
```

### View Database
```bash
node admin/view-minecraft-db.js
```

### Test System
```bash
node admin/test-brainrot-metadata.js
node admin/test-minecraft-flow.js
```

## 📚 Documentation

- `README.md` - Quick start guide
- `NOTES/` - Detailed documentation
  - Setup guides
  - API documentation
  - Implementation notes
  - Testing guides

## 🎉 Summary

**Brainrot Panopto** is a unique video learning platform that:
- Stores video files in **Cloudflare R2**
- Stores metadata as **colored blocks in Minecraft**
- Features **brainrot-themed content** (Gen Z/Alpha humor)
- Supports **TikTok-style reels** with auto-scrolling
- Has **auto-saving notes** stored in Minecraft
- Uses **vertical database organization** (three Y-level regions)
- Provides **bulk upload tools** for easy content management

**The result:** A visually engaging, technically interesting, and highly memeable video platform! 🧠🎮
