"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const util_1 = require("../util/util");
const path = require("path");
const fs = require("fs");
const empty = require("empty-folder");
const delay = require("delay");
const ffmpeg_1 = require("../util/ffmpeg");
let ffmpeg = ffmpeg_1.FFMPEG.instance;
const arguments_1 = require("../util/arguments");
let args = arguments_1.ARGUMENTS.instance;
const channel_1 = require("./channel");
const router = express_1.Router();
function asyncEmptyFolder(video_path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            empty(video_path, false, (o) => {
                if (o.error)
                    reject(o.error);
                else
                    resolve(o);
            });
        });
    });
}
function asyncWaitFileCreated(path, m3u8file) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            var timeout = setTimeout(() => {
                console.log("Waited for more then 15 seconds for the playlist file");
                reject("file_not_created");
            }, 15000);
            var watcher = fs.watch(path, (event, filename) => {
                if (filename == null) {
                    clearTimeout(timeout);
                    reject(event);
                }
                if (event == "rename" && filename == m3u8file) {
                    clearTimeout(timeout);
                    watcher.close();
                    resolve(event);
                }
            });
        });
    });
}
var prev_name = "";
const m3u8file = ".m3u8";
router.post('/', util_1.Util.asyncHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let name = req.body.name;
    let id = name.replace(' ', '_');
    var sRef = channel_1.VuSolo.instance.getSRefOfService(name);
    if (sRef.length == 0) {
        console.log("ERROR: Service [" + name + "] does not exist!");
        res.send(JSON.stringify({ "id": null }));
        return;
    }
    if (ffmpeg.isRunning() && name == prev_name) {
        console.log("OK: Already transcoding " + name);
        res.send(JSON.stringify({ "id": id }));
        return;
    }
    prev_name = "";
    if (ffmpeg.isRunning())
        ffmpeg.stop();
    var video_path = path.join(__dirname, "../video");
    yield asyncEmptyFolder(video_path);
    ffmpeg.start([
        "-i", "http://" + args.satReceiver + ":8001/" + sRef,
        "-vcodec", "copy", "-acodec", "copy", "-map", "0:0", "-map", "0:1",
        "-f", "hls", "-hls_segment_filename", id + "_%02d.ts", "-hls_flags", "delete_segments",
        id + m3u8file
    ], video_path);
    yield delay(1000);
    yield asyncWaitFileCreated(video_path, id + m3u8file);
    prev_name = name;
    console.log("OK: Started transcoding " + name);
    res.send(JSON.stringify({ "id": id }));
})));
exports.TuneController = router;
//# sourceMappingURL=tune.js.map