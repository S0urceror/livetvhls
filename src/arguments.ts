"use strict"

export class ARGUMENTS {
    private static _instance: ARGUMENTS;
    private _satreceiver:string;
    private _default_bouquet:string;
    private _ffmpeg_logging:boolean;

    constructor () {
        let args = process.argv.slice(2);
        if (args.length<3) {
            console.log ("Usage: node [sat_receiver_hostname] [default_bouquet] [ffmpeg_logging]");
            throw ("Wrong arguments")
        }
        this._satreceiver = args[0];
        this._default_bouquet = args[1];
        this._ffmpeg_logging = args[2]=="1";
    }

    get satReceiver () : string {
        return this._satreceiver;
    }
    get defaultBouquet () : string {
        return this._default_bouquet;
    }
    get FFMpegLogging () : boolean {
        return this._ffmpeg_logging;
    }

    public static get instance()
    {
        return this._instance || (this._instance = new this());
    }
}