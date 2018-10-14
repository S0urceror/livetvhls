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
const path = require("path");
const fs = require("fs");
const empty = require("empty-folder");
const cross_fetch_1 = require("cross-fetch");
const xml2js = require("xml2js");
const ffmpeg_1 = require("../ffmpeg");
let ffmpeg = ffmpeg_1.FFMPEG.instance;
const arguments_1 = require("../arguments");
let args = arguments_1.ARGUMENTS.instance;
const delay = require("delay");
var services;
var bouquets;
function asyncParseXML2JS(text) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            xml2js.parseString(text, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    });
}
const asyncExpressHandler = fn => (req, res, next) => Promise
    .resolve(fn(req, res, next))
    .catch(next);
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
function asyncWaitFileCreated(path, filename) {
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
                if (event == "rename" && filename == "playlist.m3u8") {
                    clearTimeout(timeout);
                    watcher.close();
                    resolve(event);
                }
            });
        });
    });
}
function getServices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var response = yield cross_fetch_1.default('http://' + args.satReceiver + '/web/getservices');
            var text = yield response.text();
            var result = yield asyncParseXML2JS(text);
            bouquets = result.e2servicelist.e2service;
            console.log(`Found ${bouquets.length} bouquets`);
            let sRef = getSRefOfBouquet(args.defaultBouquet);
            if (sRef.length == 0) {
                console.log("Bouquet with that name does not exist!");
                return;
            }
            let name = bouquets[0].e2servicename;
            console.log(`Using bouquet [${name}]`);
            response = yield cross_fetch_1.default('http://' + args.satReceiver + '/web/getservices?sRef=' + sRef);
            text = yield response.text();
            result = yield asyncParseXML2JS(text);
            services = result.e2servicelist.e2service;
            console.log(`Found ${services.length} services in [${name}]`);
        }
        catch (e) {
            console.log(e);
        }
    });
}
function getSRefOfBouquet(name) {
    var sRef = "";
    for (let e2service of bouquets) {
        if (e2service.e2servicename == name) {
            sRef = e2service.e2servicereference;
            break;
        }
    }
    return sRef;
}
function getSRefOfService(name) {
    var sRef = "";
    for (let e2service of services) {
        if (e2service.e2servicename == name) {
            sRef = e2service.e2servicereference;
            break;
        }
    }
    return sRef;
}
getServices();
const router = express_1.Router();
router.get('/', asyncExpressHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    res.send(JSON.stringify(services, undefined, 2));
})));
var prev_name = "";
const m3u8file = "playlist.m3u8";
router.get('/:name', asyncExpressHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let { name } = req.params;
    var sRef = getSRefOfService(name);
    if (sRef.length == 0) {
        res.send("Service with that name does not exist!");
        return;
    }
    if (ffmpeg.isRunning() && name == prev_name) {
        res.redirect("/video/" + m3u8file);
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
        "-f", "hls", "-hls_segment_filename", "segment%02d.ts", "-hls_flags", "delete_segments",
        m3u8file
    ], video_path);
    yield delay(1000);
    yield asyncWaitFileCreated(video_path, m3u8file);
    prev_name = name;
    res.redirect("/video/" + m3u8file);
})));
exports.TVController = router;
//# sourceMappingURL=tv.js.map