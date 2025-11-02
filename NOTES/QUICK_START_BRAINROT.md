# 🚀 Quick Start: Brainrot Metadata & Bulk Upload

## ✅ What's New

Your reels now have **unique brainrot-themed usernames and descriptions**!
- No more hardcoded "french_fry39"
- Each reel gets a unique identity from a pool of 100+ usernames and descriptions
- Easy bulk upload from any folder

## 🎬 Upload Reels (New!)

### Option 1: Bulk Upload Script
Upload multiple reels from a folder at once:

```bash
node bulk-upload-reels.js /path/to/reels/folder
```

**Example:**
```bash
# Upload all reels from assets folder
node bulk-upload-reels.js ./assets

# Upload from another directory
node bulk-upload-reels.js ~/Downloads/my-reels
```

**Supported formats:** `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`, `.flv`, `.m4v`

### Option 2: Manual Upload (via UI)
1. Visit: `http://localhost:3000/upload.html`
2. Select "reels" folder
3. Choose files
4. Click "Upload"
5. Run sync script:
```bash
node sync-to-minecraft.js
```

## 🧠 How Brainrot Metadata Works

### Automatic Assignment
When you upload reels, each one **automatically gets**:
- ✅ Unique username (e.g., `ohio_rizz_lord`, `mewing_mogger`)
- ✅ Unique description (e.g., "caught lacking in 4k ultra hd 📸")
- ✅ Random views (1K-1M)
- ✅ Random likes (100-50K)

### Deterministic
- Same filename always gets same metadata
- Re-uploading the same file preserves its identity
- Consistent across sessions

### Example Output
```
reel1.mp4 → @caseoh_fanboy: "4chan discovers grass (rare footage)"
reel2.mp4 → @soyjak_pointer: "literally me fr fr (not literally me)"
reel3.mp4 → @4chan_greentext: "among us in real life (sus edition) 📮"
```

## 📊 Complete Workflow

### 1. Start Servers
```bash
./start-servers.sh
```

This starts:
- Frontend (Python on port 3000)
- Backend API (Node.js on port 3001)
- Minecraft Bridge (Node.js on port 3002)

### 2. Upload Reels
```bash
node bulk-upload-reels.js /path/to/your/reels
```

**What happens:**
1. Scans folder for video files
2. Uploads each to Cloudflare R2
3. Automatically syncs to Minecraft database
4. Assigns brainrot metadata to each reel

### 3. View on Frontend
Visit: `http://localhost:3000/viewer.html`

1. Click "Reels" button
2. Watch reels scroll
3. See unique username/description for each!

## 🎮 View in Minecraft

See your reel metadata as colored blocks!

```
/tp @s 0 50 0          # Fly to reels region
/gamemode spectator
```

Your reels are stored at **Y: 5-100** with their brainrot metadata!

## 📝 Check What's Stored

### List All Reels
```bash
curl http://localhost:3002/mcdb/reels/list
```

**Example output:**
```json
{
  "success": true,
  "count": 6,
  "reels": [
    {
      "id": "reel:reels/reel1.mp4",
      "filename": "reel1.mp4",
      "username": "ohio_rizz_lord",
      "description": "only in ohio bruh 💀",
      "views": 456789,
      "likes": 23456
    }
  ]
}
```

### Get Specific Reel
```bash
curl http://localhost:3002/mcdb/reels/get/reel:reels/reel1.mp4
```

## 🧪 Test the System

### Test Content Generator
```bash
# Preview 20 random username/description pairs
node brainrot-content-generator.js 20
```

### Run Full Tests
```bash
node test-brainrot-metadata.js
```

**Tests:**
- ✅ Content generator
- ✅ Deterministic assignment
- ✅ Uniqueness
- ✅ Data structure
- ✅ Storage efficiency

## 📚 Example Brainrot Content

### Usernames (112 total)
```
skibidi_sigma, ohio_rizz_lord, gyatt_master9000
grimace_shake_survivor, mewing_mogger, ishowspeed_clone
ratio_god, sussy_imposter, griddy_dancer
backrooms_explorer, gigachad_wojak, main_character_syndrome
patrick_bateman_fan, literally_me, ryan_gosling_simp
rust_evangelist, vim_user_btw, chatgpt_coder
...and 100 more!
```

### Descriptions (102 total)
```
POV: you got that skibidi rizz 💀
bro really thought he could escape ohio 😭
caught lacking in 4k ultra hd 📸
only in ohio bruh 💀
gyatt damn this is bussin fr fr no cap 🧢
mewing tutorial (99% will fail) 😮
sigma male grindset compilation #47
among us in real life (sus edition) 📮
rust borrow checker roasts me (10 hours)
...and 93 more!
```

## 🎯 Common Commands

```bash
# Upload reels
node bulk-upload-reels.js ./my-reels

# Sync existing R2 files to Minecraft
node sync-to-minecraft.js

# View reels database
curl http://localhost:3002/mcdb/reels/list

# Preview brainrot pairs
node brainrot-content-generator.js 10

# Test system
node test-brainrot-metadata.js

# Start all servers
./start-servers.sh

# Stop all servers
./stop-servers.sh
```

## 🐛 Troubleshooting

### "No video files found"
- Check file extensions (must be .mp4, .mov, .avi, .webm, .mkv, .flv, or .m4v)
- Verify folder path is correct

### "Failed to upload"
- Ensure backend server is running on port 3001
- Check R2 credentials in `.env` file

### "Sync failed"
- Ensure Minecraft bridge is running on port 3002
- Verify Minecraft server is running
- Check plugin is loaded

### Reels not showing username/description
- Ensure you re-synced after updating:
```bash
node sync-to-minecraft.js
```
- Clear browser cache and refresh

## 💾 Backup Your Data

### Backup Minecraft World
```bash
# Your reel metadata is stored in the Minecraft world
# Backup the world folder to preserve all data
cp -r /path/to/minecraft/world /path/to/backup
```

### Export Reel List
```bash
# Save reel metadata to JSON
curl http://localhost:3002/mcdb/reels/list > reels-backup.json
```

## 🎉 You're Done!

Your brainrot metadata system is now active!

**Next steps:**
1. Upload your reels: `node bulk-upload-reels.js /path/to/reels`
2. Visit the viewer: `http://localhost:3000/viewer.html`
3. Click "Reels" and enjoy the brainrot! 🧠

---

**Questions?** Check `BRAINROT_METADATA_COMPLETE.md` for full documentation.

