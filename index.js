/* REQUIRED MODULES:
    express, express-session
*/

const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT_NO = 3000;

app.use("/lectures", express.static(path.join(__dirname, "lectures")));
app.use("/reels", express.static(path.join(__dirname, "reels")));
app.use("/sounds", express.static(path.join(__dirname, "sounds")));

app.get("/", (req, res) => {
    res.send("Hello world");
});

app.listen(PORT_NO, () => {
    console.log(`Server running on localhost:${PORT_NO}`);
});