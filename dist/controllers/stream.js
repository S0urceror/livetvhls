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
const express = require("express");
const util_1 = require("../util/util");
const ffmpeg_1 = require("../util/ffmpeg");
const path = require("path");
let ffmpeg = ffmpeg_1.FFMPEG.instance;
const router = express.Router();
router.get('/*.ts', util_1.Util.asyncHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    res.sendFile(path.join(__dirname, '../video', req.url));
})));
router.get('/:id', util_1.Util.asyncHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let { id } = req.params;
    res.sendFile(path.join(__dirname, "../video", id + ".m3u8"));
    ffmpeg.ping();
})));
exports.StreamController = router;
//# sourceMappingURL=stream.js.map