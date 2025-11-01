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

app.use(cors());

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
app.get("/login", (req, res) => {
    res.sendFile("login.html", {root: __dirname});
});
app.get("/", (req, res) => {
    res.sendFile("index.html", {root: __dirname});
});
app.get("/functions.js", (req, res) => {
    res.sendFile("functions.js", {root: __dirname});
});
app.use("/scripts", express.static(__dirname + "/scripts"));
app.use("/styles", express.static(__dirname + "/styles"));
app.use("/public", express.static(__dirname + "/public"));


// Reads a file from Cloudflare brainrot-panopto bucket
app.get("/read-file", async (req, res) => {
    const params = {
        Bucket: "brainrot-panopto",
        Key: `${req.query.folder}/${req.query.fileName}`
    };

    try {
        const command = new cloudflare.GetObjectCommand(params);
        const data = await s3.send(command);
        res.setHeader("Content-Type", "video/mp4");
        data.Body.pipe(res);
    } catch(error) {
        console.log("ERror streaming file from S3:", error);
        res.status(500).send({error: error.message});
    }
});

app.listen(PORT_NO, () => {
    console.log(`Server running on localhost:${PORT_NO}`);
});

