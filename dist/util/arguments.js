"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ARGUMENTS {
    constructor() {
        let args = process.argv.slice(2);
        if (args.length < 3) {
            console.log("Usage: node [sat_receiver_hostname] [default_bouquet] [ffmpeg_logging]");
            throw ("Wrong arguments");
        }
        this._satreceiver = args[0];
        this._default_bouquet = args[1];
        this._ffmpeg_logging = args[2] == "1";
    }
    get satReceiver() {
        return this._satreceiver;
    }
    get defaultBouquet() {
        return this._default_bouquet;
    }
    get FFMpegLogging() {
        return this._ffmpeg_logging;
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
}
exports.ARGUMENTS = ARGUMENTS;
//# sourceMappingURL=arguments.js.map