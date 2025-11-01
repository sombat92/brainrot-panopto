# Cloudflare R2 API Documentation

## 🚀 Server Setup Complete!

Your Express.js server is now running with full Cloudflare R2 integration.

### Server URLs
- **Main Server**: http://localhost:3000
- **Main Website**: http://localhost:3000/
- **Viewer**: http://localhost:3000/viewer
- **Login**: http://localhost:3000/login
- **R2 Test Dashboard**: http://localhost:3000/r2-test ⭐

### Static Website (Python Server)
- **Static Server**: http://localhost:8000
- **Static Main**: http://localhost:8000/index.html

---

## 📦 Installed Packages

All required npm packages have been installed:

```json
{
  "@aws-sdk/client-s3": "^3.668.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.21.1",
  "express-session": "^1.18.1"
}
```

---

## 🔌 R2 API Endpoints

### 1. Health Check
**GET** `/r2-health`

Verifies R2 connection is working.

**Response:**
```json
{
  "success": true,
  "message": "R2 connection successful",
  "endpoint": "https://...r2.cloudflarestorage.com",
  "bucket": "brainrot-panopto",
  "timestamp": "2025-11-01T21:26:04.890Z"
}
```

---

### 2. List Files
**GET** `/list-files?folder=<folder>&maxKeys=<number>`

Lists files in the R2 bucket.

**Query Parameters:**
- `folder` (optional): Folder/prefix to filter by (e.g., "lectures", "reels")
- `maxKeys` (optional): Maximum number of files to return (default: 1000)

**Example:**
```bash
curl "http://localhost:3000/list-files?folder=lectures"
```

**Response:**
```json
{
  "success": true,
  "folder": "lectures",
  "count": 2,
  "files": [
    {
      "key": "lectures/DE Intro.mp4",
      "size": 59626322,
      "lastModified": "2025-11-01T17:27:41.217Z",
      "etag": "\"77326256614610cd8b8b09a511322d37\""
    }
  ]
}
```

---

### 3. Read/Download File
**GET** `/read-file?folder=<folder>&fileName=<name>`

Streams a file from R2 bucket.

**Query Parameters:**
- `folder` (optional): Folder path (e.g., "lectures")
- `fileName` (required): File name (e.g., "DE Intro.mp4")

**Example:**
```bash
curl "http://localhost:3000/read-file?folder=lectures&fileName=DE%20Intro.mp4" > video.mp4
```

**Response:** Binary file stream with appropriate Content-Type header

---

### 4. Upload File
**POST** `/upload-file?folder=<folder>&fileName=<name>`

Uploads a file to R2 bucket (max 500MB).

**Query Parameters:**
- `folder` (optional): Destination folder (e.g., "uploads")
- `fileName` (required): Name for the uploaded file

**Body:** Raw file data

**Example:**
```bash
curl -X POST \
  "http://localhost:3000/upload-file?folder=test&fileName=myfile.mp4" \
  -H "Content-Type: video/mp4" \
  --data-binary @myfile.mp4
```

**Response:**
```json
{
  "success": true,
  "key": "test/myfile.mp4",
  "etag": "\"abc123...\"",
  "message": "File uploaded successfully"
}
```

---

### 5. Delete File
**DELETE** `/delete-file?folder=<folder>&fileName=<name>`

Deletes a file from R2 bucket.

**Query Parameters:**
- `folder` (optional): Folder path
- `fileName` (required): File name to delete

**Example:**
```bash
curl -X DELETE "http://localhost:3000/delete-file?folder=test&fileName=myfile.mp4"
```

**Response:**
```json
{
  "success": true,
  "key": "test/myfile.mp4",
  "message": "File deleted successfully"
}
```

---

### 6. Get File Info
**GET** `/file-info?folder=<folder>&fileName=<name>`

Gets metadata about a file without downloading it.

**Query Parameters:**
- `folder` (optional): Folder path
- `fileName` (required): File name

**Example:**
```bash
curl "http://localhost:3000/file-info?folder=lectures&fileName=DE%20Intro.mp4"
```

**Response:**
```json
{
  "success": true,
  "key": "lectures/DE Intro.mp4",
  "contentType": "video/mp4",
  "contentLength": 59626322,
  "lastModified": "2025-11-01T17:27:41.217Z",
  "etag": "\"77326256614610cd8b8b09a511322d37\"",
  "metadata": {}
}
```

---

## 🎨 Using the R2 Test Dashboard

Visit http://localhost:3000/r2-test to access the interactive dashboard:

1. **Health Check** - Verify R2 connection
2. **List Files** - Browse all files in your bucket
3. **File Info** - Get detailed metadata about files
4. **Upload** - Upload new files to R2

---

## 🔧 Environment Variables

Your `.env` file contains:

```env
R2_ENDPOINT=https://...r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=brainrot-panopto
```

---

## 📁 Current Bucket Structure

```
brainrot-panopto/
├── lectures/
│   └── DE Intro.mp4 (59.6 MB)
├── reels/
│   ├── AQM...mp4 (4.6 MB)
│   ├── AQO...mp4 (1.2 MB)
│   └── AQP...mp4 (708 KB)
└── sounds/
```

---

## 🛠️ Development Commands

```bash
# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Install dependencies
npm install
```

---

## 🌐 Integration Examples

### JavaScript (Frontend)

```javascript
// List files
async function listFiles() {
  const response = await fetch('http://localhost:3000/list-files?folder=lectures');
  const data = await response.json();
  console.log(data.files);
}

// Upload file
async function uploadFile(file) {
  const response = await fetch(
    `http://localhost:3000/upload-file?fileName=${file.name}`,
    {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': file.type }
    }
  );
  return await response.json();
}

// Get file URL
function getFileUrl(folder, fileName) {
  return `http://localhost:3000/read-file?folder=${folder}&fileName=${fileName}`;
}
```

### Python

```python
import requests

# List files
response = requests.get('http://localhost:3000/list-files?folder=lectures')
files = response.json()['files']

# Upload file
with open('video.mp4', 'rb') as f:
    response = requests.post(
        'http://localhost:3000/upload-file?fileName=video.mp4',
        data=f,
        headers={'Content-Type': 'video/mp4'}
    )
```

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "key": "path/to/file.mp4"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - File not found
- `500` - Server/R2 error

---

## 🔐 Security Notes

1. **CORS**: Currently allows all origins. Update in production:
   ```javascript
   app.use(cors({
     origin: 'https://yourdomain.com'
   }));
   ```

2. **File Size**: Upload limit is 500MB
3. **Authentication**: Consider adding API key authentication for production
4. **Rate Limiting**: Add rate limiting middleware for public APIs

---

## 📊 Supported File Types

The server automatically detects and sets correct Content-Type headers for:

- **Video**: mp4, webm, ogg
- **Audio**: mp3, wav
- **Images**: jpg, jpeg, png, gif, webp
- **Documents**: pdf, txt, html, css, js, json

---

## ✅ Status

✓ npm packages installed
✓ R2 connection verified
✓ All API endpoints working
✓ Test dashboard created
✓ Static website running (port 8000)
✓ Express server running (port 3000)

**Next Steps:**
- Integrate R2 API into your existing viewer.html
- Add file upload functionality to your website
- Implement Minecraft database server (see MINECRAFT_DATABASE_PLAN.md)

