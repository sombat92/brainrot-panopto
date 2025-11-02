/* REQUIRED MODULES:
    @aws-sdk/client-s3, cors, dotenv, express, express-session
*/

const dotenv = require("dotenv"); // Loads environment variables from .env
dotenv.config();

const cloudflare = require("@aws-sdk/client-s3");
const cors = require("cors");
const express = require("express");
const session = require("express-session");

const PORT_NO = 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const s3 = new cloudflare.S3Client({
    "region": "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

app.get("/viewer", (req, res) => {
    res.sendFile("viewer.html", {root: __dirname});
});
app.get("/test", (req, res) => {
    res.sendFile("test.html", {root: __dirname});
});
app.get("/r2-test", (req, res) => {
    res.sendFile("r2-test.html", {root: __dirname});
});
app.get("/upload", (req, res) => {
    res.sendFile("upload.html", {root: __dirname});
});
app.get("/login", (req, res) => {
    res.sendFile("login.html", {root: __dirname});
});
app.get("/", (req, res) => {
    res.sendFile("index.html", {root: __dirname});
});
app.get("/functions.js", (req, res) => {
    res.sendFile("functions.js", {root: __dirname});
});
app.use("/assets", express.static(__dirname + "/assets"));
app.use("/scripts", express.static(__dirname + "/scripts"));
app.use("/styles", express.static(__dirname + "/styles"));
app.use("/public", express.static(__dirname + "/public"));


// ============================================
// CLOUDFLARE R2 API ENDPOINTS
// ============================================

// Health check endpoint - verify R2 connection
app.get("/r2-health", async (req, res) => {
    const bucketName = process.env.R2_BUCKET_NAME || "brainrot-panopto";
    
    try {
        // Simple list objects command to verify connection
        const command = new cloudflare.ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1
        });
        await s3.send(command);
        
        res.status(200).send({
            success: true,
            message: "R2 connection successful",
            endpoint: process.env.R2_ENDPOINT,
            bucket: bucketName,
            timestamp: new Date().toISOString()
        });
    } catch(error) {
        console.log("R2 health check failed:", error);
        res.status(500).send({
            success: false,
            error: error.message,
            errorCode: error.Code,
            endpoint: process.env.R2_ENDPOINT,
            bucket: bucketName
        });
    }
});

// Reads a file from Cloudflare R2 bucket
app.get("/read-file", async (req, res) => {
    const folder = req.query.folder || "";
    const fileName = req.query.fileName;
    
    if (!fileName) {
        return res.status(400).send({ error: "fileName is required" });
    }

    const key = folder ? `${folder}/${fileName}` : fileName;
    const params = {
        Bucket: process.env.R2_BUCKET_NAME || "brainrot-panopto",
        Key: key
    };

    try {
        const command = new cloudflare.GetObjectCommand(params);
        const data = await s3.send(command);
        
        // Set appropriate content type
        const contentType = data.ContentType || getContentType(fileName);
        res.setHeader("Content-Type", contentType);
        
        // Stream the file
        data.Body.pipe(res);
    } catch(error) {
        console.log("Error streaming file from R2:", error);
        res.status(error.$metadata?.httpStatusCode || 500).send({
            error: error.message,
            key: key
        });
    }
});

// Upload a file to Cloudflare R2 bucket
app.post("/upload-file", express.raw({ limit: "500mb", type: "*/*" }), async (req, res) => {
    const folder = req.query.folder || "";
    const fileName = req.query.fileName;
    
    if (!fileName) {
        return res.status(400).send({ error: "fileName is required" });
    }

    const key = folder ? `${folder}/${fileName}` : fileName;
    const params = {
        Bucket: process.env.R2_BUCKET_NAME || "brainrot-panopto",
        Key: key,
        Body: req.body,
        ContentType: req.headers['content-type'] || getContentType(fileName)
    };

    try {
        const command = new cloudflare.PutObjectCommand(params);
        const data = await s3.send(command);
        
        res.status(200).send({
            success: true,
            key: key,
            etag: data.ETag,
            message: "File uploaded successfully"
        });
    } catch(error) {
        console.log("Error uploading file to R2:", error);
        res.status(500).send({
            error: error.message,
            key: key
        });
    }
});

// List files in a folder (or entire bucket)
app.get("/list-files", async (req, res) => {
    const folder = req.query.folder || "";
    const maxKeys = parseInt(req.query.maxKeys) || 1000;

    const params = {
        Bucket: process.env.R2_BUCKET_NAME || "brainrot-panopto",
        Prefix: folder,
        MaxKeys: maxKeys
    };

    try {
        const command = new cloudflare.ListObjectsV2Command(params);
        const data = await s3.send(command);
        
        const files = (data.Contents || []).map(item => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
            etag: item.ETag
        }));

        res.status(200).send({
            success: true,
            folder: folder,
            count: files.length,
            files: files
        });
    } catch(error) {
        console.log("Error listing files from R2:", error);
        res.status(500).send({
            error: error.message
        });
    }
});

// Delete a file from Cloudflare R2 bucket
app.delete("/delete-file", async (req, res) => {
    const folder = req.query.folder || "";
    const fileName = req.query.fileName;
    
    if (!fileName) {
        return res.status(400).send({ error: "fileName is required" });
    }

    const key = folder ? `${folder}/${fileName}` : fileName;
    const params = {
        Bucket: process.env.R2_BUCKET_NAME || "brainrot-panopto",
        Key: key
    };

    try {
        const command = new cloudflare.DeleteObjectCommand(params);
        await s3.send(command);
        
        res.status(200).send({
            success: true,
            key: key,
            message: "File deleted successfully"
        });
    } catch(error) {
        console.log("Error deleting file from R2:", error);
        res.status(500).send({
            error: error.message,
            key: key
        });
    }
});

// Get file metadata without downloading
app.get("/file-info", async (req, res) => {
    const folder = req.query.folder || "";
    const fileName = req.query.fileName;
    
    if (!fileName) {
        return res.status(400).send({ error: "fileName is required" });
    }

    const key = folder ? `${folder}/${fileName}` : fileName;
    const params = {
        Bucket: process.env.R2_BUCKET_NAME || "brainrot-panopto",
        Key: key
    };

    try {
        const command = new cloudflare.HeadObjectCommand(params);
        const data = await s3.send(command);
        
        res.status(200).send({
            success: true,
            key: key,
            contentType: data.ContentType,
            contentLength: data.ContentLength,
            lastModified: data.LastModified,
            etag: data.ETag,
            metadata: data.Metadata
        });
    } catch(error) {
        console.log("Error getting file info from R2:", error);
        res.status(error.$metadata?.httpStatusCode || 500).send({
            error: error.message,
            key: key
        });
    }
});

// Helper function to determine content type from file extension
function getContentType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const contentTypes = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'json': 'application/json',
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript'
    };
    return contentTypes[ext] || 'application/octet-stream';
}

app.listen(PORT_NO, () => {
    console.log(`Server running on localhost:${PORT_NO}`);
});

