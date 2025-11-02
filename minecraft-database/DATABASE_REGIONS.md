# Minecraft Database Regions - Vertical Organization

## 📊 Architecture Overview

Two separate database regions organized **vertically** (different Y-levels):

```
┌─────────────────────────────────────┐
│     LECTURES DATABASE               │ 
│     Y: 105-200 (95 blocks high)     │  ← Store lecture metadata
│     Region: "lectures"               │
├─────────────────────────────────────┤
│     EMPTY BUFFER ZONE               │
│     Y: 101-104 (4 blocks)           │  ← Separator
├─────────────────────────────────────┤
│     REELS DATABASE                  │
│     Y: 5-100 (95 blocks high)       │  ← Store reel metadata
│     Region: "reels"                 │
└─────────────────────────────────────┘
```

## 🎯 Database Regions

### Region 1: Reels Database
- **Y-Range:** 5-100 (95 blocks high)
- **Purpose:** Store metadata for Instagram-style reels
- **Data Stored:**
  - R2 file key/path
  - File size
  - Upload timestamp
  - Video duration (if available)
  - Thumbnail location
  - View count, likes, etc.

### Region 2: Lectures Database
- **Y-Range:** 105-200 (95 blocks high)
- **Purpose:** Store metadata for lecture recordings
- **Data Stored:**
  - R2 file key/path
  - Lecture title
  - Instructor name
  - Duration
  - Upload date
  - Module/category
  - Thumbnail location

## 🔑 Data Format

### Reel Metadata (JSON)
```json
{
  "id": "reel_001",
  "r2_key": "reels/AQMLV-yAiIf9wDEIPXQh-5e63gfBAAS5B4S5ggsl0zYoiw2fuhPT2TRYysCPhD9PB3bCAseD2KbD0eu8LmlJl_xLheTXG6ohuo_nWNk.mp4",
  "folder": "reels",
  "filename": "AQMLV-yAiIf9wDEIPXQh-5e63gfBAAS5B4S5ggsl0zYoiw2fuhPT2TRYysCPhD9PB3bCAseD2KbD0eu8LmlJl_xLheTXG6ohuo_nWNk.mp4",
  "size": 4610871,
  "uploaded_at": "2025-11-01T14:22:56.555Z",
  "etag": "bd5b3c595b8e6405a59cfe9e7207a702",
  "duration": 30,
  "views": 0,
  "likes": 0
}
```

### Lecture Metadata (JSON)
```json
{
  "id": "lecture_001",
  "r2_key": "lectures/DE Intro.mp4",
  "folder": "lectures",
  "filename": "DE Intro.mp4",
  "title": "Data Engineering Introduction",
  "module": "Data Engineering",
  "instructor": "Chris Rogers",
  "duration": "45:32",
  "thumbnail": "/lecture-1.jpg",
  "uploaded_at": "2024-11-15T00:00:00.000Z",
  "size": 127890435,
  "description": "Introduction to data engineering concepts"
}
```

## 🛠️ API Endpoints

### Reel Operations
- `POST /mcdb/reels/sync` - Sync all R2 reels to Minecraft
- `GET /mcdb/reels/list` - List all reels from Minecraft
- `GET /mcdb/reels/:id` - Get specific reel metadata
- `POST /mcdb/reels/:id` - Add/update reel metadata
- `DELETE /mcdb/reels/:id` - Remove reel metadata

### Lecture Operations
- `POST /mcdb/lectures/sync` - Sync all R2 lectures to Minecraft
- `GET /mcdb/lectures/list` - List all lectures from Minecraft
- `GET /mcdb/lectures/:id` - Get specific lecture metadata
- `POST /mcdb/lectures/:id` - Add/update lecture metadata
- `DELETE /mcdb/lectures/:id` - Remove lecture metadata

## 🔄 Sync Process

1. **Frontend/Backend calls sync endpoint**
2. **Bridge server fetches R2 file list**
3. **For each file:**
   - Create metadata JSON
   - Generate unique key (e.g., `reel:AQMLV-yAi...` or `lecture:DE_Intro`)
   - Encode as base64
   - Send WRITE command with appropriate key prefix
4. **Minecraft plugin writes to correct Y-level based on key prefix**

## 📝 Key Naming Convention

- **Reels:** `reel:AQMLV-yAiIf9wDEIPXQh...` (uses original filename)
- **Lectures:** `lecture:DE_Intro` (uses simplified title)

The bridge server will use key prefixes to determine which Y-level region to use.

## 💾 Capacity Estimation

With current configuration:
- **Area:** 4x4 chunks = 64x64 blocks horizontal
- **Reels Height:** 95 blocks (Y: 5-100)
- **Lectures Height:** 95 blocks (Y: 105-200)

**Total blocks per region:** 64 × 64 × 95 = 389,120 blocks

With ~48 blocks per entry (16 key + 32 value):
- **Capacity per region:** ~8,100 entries
- **Total capacity:** ~16,200 entries

More than enough for reels and lectures!

## 🎨 Visualization Ideas

Since the data is stored as colored blocks, you could:
- Use different block palettes for reels vs lectures
- Create "heatmaps" showing popular content
- Visualize data density in 3D
- Build viewing platforms at different Y-levels

## 🚀 Benefits of Vertical Organization

1. **Clear Separation:** Different Y-levels = different purposes
2. **Easy Debugging:** Fly to Y=50 for reels, Y=150 for lectures
3. **Independent Scaling:** Can expand one region without affecting the other
4. **Visual Organization:** Literally see two databases stacked
5. **Namespace Management:** Simple Y-level check determines database type

