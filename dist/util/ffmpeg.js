"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const arguments_1 = require("./arguments");
let args = arguments_1.ARGUMENTS.instance;
class FFMPEG {
    constructor() {
        this.ffmpeg = null;
        this.running = false;
        this.lastping = 0;
    }
    start(options, working_directory) {
        this.ffmpeg = child_process.spawn("ffmpeg", options, { cwd: working_directory });
        this.ffmpeg.on('error', err => console.error(err));
        if (args.FFMpegLogging) {
            this.ffmpeg.stderr.on('data', (data) => { console.log(`${data}`); });
            this.ffmpeg.stdout.on('data', (data) => { console.log(`${data}`); });
        }
        this.ffmpeg.on('exit', code => {
            console.log('FFMPEG exited with code ' + code);
            this.running = false;
        });
        this.ping();
        this.timer = setInterval(FFMPEG.checkTimeSinceLastPing, 500);
        this.running = true;
    }
    isRunning() {
        return this.running;
    }
    stop() {
        this.running = false;
        clearInterval(this.timer);
        this.ffmpeg.kill();
    }
    static checkTimeSinceLastPing() {
        let ffmpeg = FFMPEG.instance;
        if (Date.now() - ffmpeg.lastping > 30000) {
            if (ffmpeg.isRunning()) {
                console.log('FFMPEG is closing, no pings the last 30 seconds');
                ffmpeg.stop();
            }
        }
    }
    ping() {
        console.log('FFMPEG ping:', Date.now());
        this.lastping = Date.now();
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
}
exports.FFMPEG = FFMPEG;
//# sourceMappingURL=ffmpeg.js.map