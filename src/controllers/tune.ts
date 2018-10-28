"use strict"

/*
POST    /tune?name=[channelname]    tunes to the channel identified by [channelname], returns a [stream_id]
*/

import { Router, Request, Response } from 'express';
import { Util } from '../util/util';
import * as path from 'path';
import * as fs from 'fs';
import * as empty from 'empty-folder';
import * as delay from 'delay';
import { FFMPEG } from '../util/ffmpeg';
let ffmpeg = FFMPEG.instance;
import { ARGUMENTS } from '../util/arguments';
let args = ARGUMENTS.instance;
import { VuSolo } from './channel';

// Assign router to the express.Router() instance
const router: Router = Router();

// empty-folder 
async function asyncEmptyFolder (video_path:string) : Promise <any> {
    return new Promise ((resolve, reject) => {
        empty(video_path,false, (o) => {
            if(o.error) 
                reject (o.error)
            else 
                resolve (o);
        });
    });
}
// wait until a file with a certain name is created
async function asyncWaitFileCreated (path: string, m3u8file: string) : Promise <any> {
    return new Promise ((resolve, reject) => {
        var timeout:any = setTimeout (() => {
            console.log ("Waited for more then 15 seconds for the playlist file");
            reject ("file_not_created");
        },15000);
        var watcher = fs.watch (path,(event,filename) => {
            if (filename==null) {
                clearTimeout (timeout);
                reject (event);
            }
            if (event=="rename" && filename==m3u8file) {
                clearTimeout (timeout);
                watcher.close();
                resolve (event);
            }
        });
    });
}

// route to start the transcoder for a specific channel
var prev_name:string = "";
const m3u8file:string = ".m3u8";
router.post('/', Util.asyncHandler( async (req: Request, res: Response, next: any) => {
    // Extract the name from the request parameters
    let name:string = req.body.name;
    let id = name.replace (' ','_');
    
    var sRef : string = VuSolo.instance.getSRefOfService (name);
    if (sRef.length==0) {
        console.log ("ERROR: Service ["+name+"] does not exist!");
        res.send (JSON.stringify({"id":null}));
        return;
    }
    if (ffmpeg.isRunning() && name==prev_name) {
        // already transcoding this channel
        console.log ("OK: Already transcoding "+name);
        res.send (JSON.stringify({"id":id}));
        return;
    }
    prev_name = "";
    // stop previous transcoding process if it's running
    if (ffmpeg.isRunning ())
        ffmpeg.stop ();
    // empty video fragments folder
    var video_path = path.join(__dirname,"../video");
    await asyncEmptyFolder (video_path);
    // spawn ffmpeg trancoding process
    ffmpeg.start ([
        "-i","http://"+args.satReceiver+":8001/"+sRef,
        "-vcodec","copy","-acodec","copy","-map","0:0","-map","0:1",
        "-f","hls","-hls_segment_filename",id+"_%02d.ts","-hls_flags","delete_segments",
        id+m3u8file
    ],video_path);
    await delay (1000);
    // wait for video/playlist.m3u8 to appear
    await asyncWaitFileCreated (video_path,id+m3u8file);
    prev_name = name;
    console.log ("OK: Started transcoding "+name);
    res.send (JSON.stringify({"id":id}));
}));

// Export the express.Router() instance to be used by server.ts
export const TuneController: Router = router;