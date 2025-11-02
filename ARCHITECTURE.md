# Brainrot Panopto Architecture

## 📁 Directory Structure

```
brainrot-panopto/
├── frontend/          # Static frontend files (served by Python)
│   ├── index.html    # Main landing page
│   ├── viewer.html   # Lecture viewer with reels
│   ├── login.html    # Login page
│   ├── upload.html   # File upload interface
│   ├── r2-test.html  # R2 API testing interface
│   ├── scripts/      # JavaScript files
│   ├── styles/       # CSS files
│   ├── public/       # Public images
│   └── assets/       # Local video assets
│
├── backend/           # Node.js API server
│   ├── index.js      # Express server with R2 endpoints
│   ├── package.json  # Backend dependencies
│   └── .env          # Environment variables
│
└── minecraft-database/
    └── bridge-server/ # Minecraft database bridge (port 3001)
```

## 🏗️ Architecture Overview

### Three-Tier Architecture

1. **Frontend (Python HTTP Server - Port 3000)**
   - Serves static HTML, CSS, and JavaScript files
   - Python's `http.server` for simplicity
   - No server-side logic, pure static files
   - Access: http://localhost:3000

2. **Backend API (Node.js - Port 3001)**
   - Express.js REST API
   - Handles Cloudflare R2 storage operations
   - CORS enabled for frontend access
   - Endpoints:
     - `GET /r2-health` - Check R2 connection
     - `GET /read-file` - Stream files from R2
     - `POST /upload-file` - Upload files to R2
     - `GET /list-files` - List files in R2
     - `DELETE /delete-file` - Delete files from R2
     - `GET /file-info` - Get file metadata
   - Access: http://localhost:3001

3. **Minecraft Database Bridge (Node.js - Port 3001)**
   - Separate bridge server for Minecraft database
   - Located in `minecraft-database/bridge-server/`
   - Connects to Minecraft server on port 25566
   - Provides HTTP API for Minecraft database operations

## 🚀 Starting the Servers

### Quick Start

```bash
# Terminal 1: Start Backend API (R2)
cd backend
node index.js

# Terminal 2: Start Frontend
cd frontend
python3 -m http.server 3000

# Terminal 3: Start Minecraft Bridge (optional)
cd minecraft-database/bridge-server
npm start
```

### Using NPM Scripts (from root)

```bash
# Frontend (from frontend/ directory)
cd frontend && python3 -m http.server 3000

# Backend (from backend/ directory)
cd backend && npm start
```

## 🔗 API Integration

The frontend calls the backend API using the configured base URL:

**In JavaScript files:**
```javascript
const API_BASE_URL = 'http://localhost:3001';

// Example API call
fetch(`${API_BASE_URL}/read-file?folder=reels&fileName=video.mp4`)
```

**Files using API:**
- `frontend/scripts/data.js` - Lecture and reel data
- `frontend/scripts/functions.js` - Video loading function
- `frontend/upload.html` - File upload functionality
- `frontend/r2-test.html` - R2 testing interface

## 🎥 How Reels Work

Reels are stored in **Cloudflare R2** and streamed through the backend API:

1. Frontend requests video from R2: `${API_BASE_URL}/read-file?folder=reels&fileName=video.mp4`
2. Backend API authenticates with R2 using AWS SDK
3. Backend streams video directly to frontend
4. Video plays in the viewer's popup windows

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=brainrot-panopto
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### CORS Configuration

The backend is configured to accept requests from the frontend:

```javascript
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
```

## 📊 Separation of Concerns

| Layer | Technology | Purpose | Port |
|-------|-----------|---------|------|
| Frontend | Python HTTP | Serve static files | 3000 |
| Backend | Node.js/Express | API & R2 operations | 3001 |
| Database | Minecraft + Bridge | Data storage | 25566 |

## 🎯 Benefits of This Architecture

1. **Clear Separation**: Frontend and backend are completely separated
2. **Easy Development**: Modify frontend without restarting backend
3. **Flexible Deployment**: Can deploy frontend and backend separately
4. **Simple Frontend**: No build process needed for static files
5. **Scalable**: Can add load balancers, CDNs, etc.

## 📝 Notes

- Frontend uses relative paths for static assets (CSS, JS, images)
- Frontend uses absolute URLs for API calls (http://localhost:3001)
- Both servers must be running for full functionality
- Minecraft database is optional depending on your use case

