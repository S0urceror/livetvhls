"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const controllers_1 = require("./controllers");
const ffmpeg_1 = require("./ffmpeg");
let ffmpeg = ffmpeg_1.FFMPEG.instance;
const app = express();
const port = Number(process.env.PORT) || 8080;
app.use('/video/:file', function (req, res, next) {
    if (req.params.file == "playlist.m3u8") {
        ffmpeg.ping();
    }
    next();
});
app.use('/video', express.static(path.join(__dirname, 'video')));
app.use('/tv', controllers_1.TVController);
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});
//# sourceMappingURL=index.js.map