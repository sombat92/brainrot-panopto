# 📹 New Reels Upload Guide

## Quick Start

### 1. Add Your Videos
```bash
# Copy your .mp4 files to the upload folder:
cp /path/to/your/videos/*.mp4 reels-to-upload/
```

### 2. Upload to R2 & Minecraft
```bash
node admin/bulk-upload-reels.js reels-to-upload
```

### 3. View Your Reels
```
Open: http://localhost:3000/viewer.html
Click: 🎬 button in header
```

**Done!** 🎉

---

## What Just Happened

### Old Reels Cleaned
- ✅ All old reels deleted from R2
- ✅ Fresh start for new content
- ✅ Minecraft database ready for new data

### Upload Folder Created
```
brainrot-panopto/
└── reels-to-upload/     ← Add your .mp4 files here
    └── README.md        (Instructions)
```

### Upload Process
```
Your .mp4 files
    ↓
Upload to Cloudflare R2 (storage)
    ↓
Generate brainrot metadata (username, description)
    ↓
Auto-sync to Minecraft (Y: 64-143)
    ↓
Appear in reels popup! 🎬
```

---

## Detailed Steps

### Step 1: Prepare Videos

**Requirements:**
- Format: `.mp4`, `.webm`, or `.mov`
- Orientation: Vertical (9:16 ratio recommended)
- Duration: 15-60 seconds ideal
- Size: Under 50MB per file
- Quality: 720p or 1080p

**Example:**
```bash
# If your videos are elsewhere, copy them:
cp ~/Downloads/reel1.mp4 reels-to-upload/
cp ~/Downloads/reel2.mp4 reels-to-upload/
cp ~/Downloads/reel3.mp4 reels-to-upload/
```

### Step 2: Run Upload Script

```bash
cd /Users/michael/Documents/Home/brainrot-panopto
node admin/bulk-upload-reels.js reels-to-upload
```

**What you'll see:**
```
╔════════════════════════════════════════════╗
║   📹 Bulk Reel Upload & Sync System      ║
╚════════════════════════════════════════════╝

📁 Reading folder: reels-to-upload
📹 Found 5 video files to upload

Uploading: reel1.mp4
  📦 Size: 12.5 MB
  👤 Username: skibidi_gamer_2847
  📝 Description: "POV you discover the matrix is..."
  ✅ Uploaded successfully!

... (repeats for each file) ...

════════════════════════════════════════════
✅ Upload Complete!
════════════════════════════════════════════
   ✓ Uploaded: 5 files
   ✗ Failed: 0 files

🔄 Triggering sync to Minecraft database...
✅ Sync triggered successfully!

🎉 Your reels will appear on the website in ~5 seconds!

👉 View at: http://localhost:3000/viewer.html
   Click the 🎬 button in the header!
```

### Step 3: Verify Upload

**Check R2:**
```bash
curl -s http://localhost:3001/list-files?folder=reels | jq '.files | length'
```

**Check Minecraft:**
```bash
curl -s http://localhost:3002/mcdb/reels/list | jq '.count'
```

**Check Website:**
- Open: http://localhost:3000/viewer.html
- Click: Blue 🎬 button in header
- See: All 3 popup styles with your new reels!

---

## Features

### Brainrot Metadata Generation
Each reel gets a unique username and description:

**Usernames:**
- `skibidi_toilet_wizard_420`
- `gyatt_rizzler_ultra_2847`
- `sigma_male_grindset_9001`
- `based_chad_supreme_1337`
- `alpha_wolf_pack_leader_69`

**Descriptions:**
- "POV you discover the forbidden lore..."
- "This goes so hard fr fr no cap..."
- "Bro really thought he could escape the aura..."
- "The vibe shift is crazy with this one..."

### Auto-Sync to Minecraft
- Runs automatically after upload
- Stores at Y: 64-143 (ground level)
- Metadata encoded as colored blocks
- Persistent storage in Minecraft world

### Multi-Popup Display
Your reels appear in 3 different styles:
1. **Instagram** (left) - Modern social media
2. **iPhone** (center) - Apple-style with notch
3. **Windows 95** (right) - Retro aesthetic

---

## Troubleshooting

### "No such file or directory"
```bash
# Make sure you're in the right directory:
cd /Users/michael/Documents/Home/brainrot-panopto
```

### "Connection refused"
```bash
# Check if servers are running:
./check-servers.sh

# If not, start them:
./start-servers.sh
```

### "No available space in database"
```bash
# Deploy updated Minecraft plugin:
./admin/deploy-plugin.sh
# Then restart Minecraft server
```

### Reels not appearing
```bash
# 1. Check if uploaded to R2:
curl http://localhost:3001/list-files?folder=reels

# 2. Manually trigger sync:
curl -X POST http://localhost:3002/mcdb/auto-sync/trigger

# 3. Wait 5 seconds, then check Minecraft:
curl http://localhost:3002/mcdb/reels/list

# 4. Reload website:
open http://localhost:3000/viewer.html
```

---

## Advanced Options

### Delete Specific Reel
```bash
curl -X DELETE http://localhost:3001/delete-file \
  -H "Content-Type: application/json" \
  -d '{"key": "reels/filename.mp4"}'
```

### List All Reels
```bash
curl http://localhost:3001/list-files?folder=reels | jq '.files'
```

### Clear Minecraft Database
```bash
# (Advanced - use with caution)
curl -X DELETE http://localhost:3002/mcdb/delete/reel:filename
```

### Manual Sync
```bash
curl -X POST http://localhost:3002/mcdb/auto-sync/trigger
```

---

## File Specifications

### Supported Formats
- ✅ `.mp4` (H.264/H.265)
- ✅ `.webm` (VP8/VP9)
- ✅ `.mov` (QuickTime)
- ❌ `.avi` (not supported)
- ❌ `.flv` (not supported)

### Recommended Settings
- **Resolution:** 1080x1920 (9:16)
- **Frame Rate:** 30fps or 60fps
- **Codec:** H.264
- **Bitrate:** 5-10 Mbps
- **Audio:** AAC, 128kbps

---

## Example Workflow

```bash
# 1. Clean slate (already done for you)
# Old reels deleted ✓

# 2. Add your videos
cp ~/Desktop/my-reels/*.mp4 reels-to-upload/

# 3. Check what you have
ls -lh reels-to-upload/

# 4. Upload!
node admin/bulk-upload-reels.js reels-to-upload

# 5. Verify
curl http://localhost:3002/mcdb/reels/list | jq '.count'

# 6. View on website
open http://localhost:3000/viewer.html
```

---

## Summary

✅ **Old reels:** Deleted from R2  
✅ **Upload folder:** Created at `reels-to-upload/`  
✅ **Script ready:** Enhanced with colors and feedback  
✅ **Auto-sync:** Will trigger after upload  
✅ **Metadata:** Brainrot usernames/descriptions generated  

**Ready to upload!** Just add your `.mp4` files to `reels-to-upload/` and run the script! 🚀

