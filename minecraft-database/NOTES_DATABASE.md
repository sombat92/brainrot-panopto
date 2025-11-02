# 📝 Notes Database - 3rd Vertical Region

## 🏗️ Updated Architecture

```
┌─────────────────────────────────────┐
│     NOTES DATABASE                  │ 
│     Y: 201-250 (49 blocks high)     │  ← Store user notes
│     Region: "notes"                 │
│     Keys: note:{lectureId}          │
├─────────────────────────────────────┤
│     LECTURES DATABASE               │ 
│     Y: 105-200 (95 blocks high)     │  ← Store lecture metadata
│     Region: "lectures"              │
│     Keys: lecture:*                 │
├─────────────────────────────────────┤
│     EMPTY BUFFER ZONE               │
│     Y: 101-104 (4 blocks)           │  ← Separator
├─────────────────────────────────────┤
│     REELS DATABASE                  │
│     Y: 5-100 (95 blocks high)       │  ← Store reel metadata
│     Region: "reels"                 │
│     Keys: reel:*                    │
└─────────────────────────────────────┘
```

## 📊 Notes Database Details

### Region 3: Notes Database
- **Y-Range:** 201-250 (49 blocks high)
- **Purpose:** Store user notes for each lecture
- **Key Format:** `note:{lectureId}` or `note:{userId}_{lectureId}`
- **Data Stored:**
  - Note content (text)
  - Last modified timestamp
  - Lecture identifier
  - User identifier (for multi-user support later)
  - Word count
  - Auto-save status

### Note Data Format (JSON)
```json
{
  "id": "note:lecture_DE_Intro_mp4",
  "lectureId": "lecture:DE_Intro_mp4",
  "userId": "default",
  "content": "User's notes here...",
  "lastModified": "2025-11-02T12:30:00.000Z",
  "wordCount": 145,
  "charCount": 892,
  "created": "2025-11-01T10:00:00.000Z"
}
```

## 🔄 Auto-Save Flow

```
User Types in Notes Panel
     ↓
Debounced Save (2 seconds)
     ↓
POST /mcdb/notes/save
     ↓
Minecraft Plugin Writes to Y: 201-250
     ↓
Status Indicator: "Saved" (green)
```

## 🎯 Key Features

### 1. **Per-Lecture Notes**
- Each lecture can have its own notes
- Notes are linked by lecture ID
- Easy to retrieve when viewing the same lecture

### 2. **Auto-Save**
- Save after 2 seconds of inactivity
- Visual status indicator (Saved/Saving/Error)
- No manual save button needed

### 3. **Persistent Storage**
- Notes stored as colored blocks in Minecraft
- Survives server restarts
- Can be backed up with Minecraft world

### 4. **Multi-User Ready**
- Currently single user (`userId: "default"`)
- Architecture supports multiple users
- Just prefix keys with user ID

## 📡 API Endpoints

### Save Note
```
POST /mcdb/notes/save
Body: {
  "lectureId": "lecture:DE_Intro_mp4",
  "userId": "default",
  "content": "Note text..."
}
Response: {
  "success": true,
  "noteId": "note:lecture_DE_Intro_mp4",
  "lastModified": "2025-11-02T12:30:00.000Z"
}
```

### Get Note
```
GET /mcdb/notes/get/:lectureId
Response: {
  "success": true,
  "note": {
    "id": "note:lecture_DE_Intro_mp4",
    "lectureId": "lecture:DE_Intro_mp4",
    "content": "Note text...",
    "lastModified": "2025-11-02T12:30:00.000Z",
    "wordCount": 145
  }
}
```

### List All Notes
```
GET /mcdb/notes/list
Response: {
  "success": true,
  "count": 5,
  "notes": [...]
}
```

### Delete Note
```
DELETE /mcdb/notes/delete/:lectureId
Response: {
  "success": true,
  "message": "Note deleted"
}
```

## 💾 Capacity

With current setup (4×4 chunks, 49 blocks high):

```
Blocks: 64 × 64 × 49 = 200,704 blocks

With optimized encoding (1 block = 1 byte):
200,704 bytes = ~196 KB per region

Average note: ~2 KB
Capacity: ~100 notes

Enough for extensive note-taking!
```

## 🎨 Visual in Minecraft

```
Y=250 ┌─────────────┐
      │   NOTES     │ ← Purple/pink blocks
      │             │   (Different from lectures)
Y=201 ├─────────────┤
Y=200 │  LECTURES   │ ← Blue/cyan blocks
      │             │
Y=105 ├─────────────┤
Y=104 │   BUFFER    │ ← Empty air
Y=101 ├─────────────┤
Y=100 │   REELS     │ ← Red/orange blocks
      │             │
Y=5   └─────────────┘
```

## 🔧 Frontend Integration

### Auto-Save Implementation
```javascript
let saveTimeout;
const notesTextarea = document.getElementById('notes-textarea');

notesTextarea.addEventListener('input', () => {
  // Show "Saving..." status
  updateStatus('saving');
  
  // Debounce save
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await saveNoteToMinecraft();
    updateStatus('saved');
  }, 2000);
});
```

### Load Notes on Page Load
```javascript
async function loadNotesForLecture(lectureId) {
  const response = await fetch(
    `${MINECRAFT_BRIDGE_URL}/mcdb/notes/get/${lectureId}`
  );
  const data = await response.json();
  
  if (data.success && data.note) {
    notesTextarea.value = data.note.content;
  }
}
```

## 🎯 User Experience

### Visual Feedback
- **Green dot:** "Saved" - notes are safe in Minecraft
- **Orange dot:** "Saving..." - actively syncing
- **Red dot:** "Error" - save failed, will retry

### Status Text
- Bottom of notes panel shows: "Auto-saves to Minecraft (Y: 201-250)"
- Reminds users their notes are stored as blocks!

## 🚀 Future Enhancements

### Multi-User Support
```javascript
// Change key format:
// From: note:lecture_DE_Intro_mp4
// To:   note:user123_lecture_DE_Intro_mp4

// Add user ID to all note operations
{
  userId: "user123",  // From login session
  lectureId: "lecture:DE_Intro_mp4",
  content: "..."
}
```

### Rich Text Support
- Store markdown formatting
- Preserve formatting in Minecraft JSON
- Render with markdown parser

### Note Sharing
- Export note as text file
- Share note between users
- Collaborative notes (real-time sync)

### Search Notes
- Full-text search across all notes
- Find notes by lecture
- Search by keywords

## 📊 Comparison

| Database | Y-Range | Purpose | Keys | Typical Size |
|----------|---------|---------|------|--------------|
| Reels | 5-100 | Reel metadata | reel:* | ~500 bytes |
| Lectures | 105-200 | Lecture metadata | lecture:* | ~800 bytes |
| Notes | 201-250 | User notes | note:* | ~2,000 bytes |

## 🎮 In-Game Commands

```
# View notes database
/tp @s 0 225 0
/gamemode spectator

# View all three regions
/tp @s 0 125 0   # Center of all three databases
```

## 🔍 Debug

Check if notes are saving:
```bash
# View all notes
curl http://localhost:3002/mcdb/notes/list

# Get specific note
curl http://localhost:3002/mcdb/notes/get/lecture:DE_Intro_mp4

# Check stats
curl http://localhost:3002/mcdb/stats
```

## ✅ Benefits

1. **Always Visible:** Notes on left side, always in view
2. **Auto-Save:** Never lose your notes
3. **Persistent:** Stored in Minecraft world
4. **Scalable:** Ready for multi-user
5. **Visual:** See your notes as colored blocks!
6. **Portable:** Backup = backup Minecraft world

---

**Now you have THREE vertically organized databases in Minecraft!** 🎮📝

