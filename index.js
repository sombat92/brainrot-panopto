/* REQUIRED MODULES:
    @aws-sdk/client-s3, cors, express, express-session
*/

const cloudflare = require("@aws-sdk/client-s3");
const cors = require("cors");
const express = require("express");
const session = require("express-session");

const PORT_NO = 3000;
const app = express();

app.use(cors());

const s3 = new cloudflare.S3Client({
    "region": "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Helper to convert S3 streams to strings
const streamToString = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return ArrayBuffer.concat(chunks).toString("utf-8");
}

app.get("/", (req, res) => {
    res.send("Hello world");
});

// Reads a file from Cloudflare brainrot-panopto bucket
app.get("/read-file", async (req, res) => {
    const params = {
        Bucket: "brainrot-panopto",
        Key: `${req.query.folder}/${req.query.fileName}`
    };

    try {
        const command = new GetObjectCommand(params);
        const data = await s3.send(command);
        const content = await streamToString(data.Body);
        res.status(200).send(JSON.parse(content));
    } catch(error) {
        res.status(500).send({error: error.message});
    }
});

app.listen(PORT_NO, () => {
    console.log(`Server running on localhost:${PORT_NO}`);
});