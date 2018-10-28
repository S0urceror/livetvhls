"use strict"

/*
GET     /stream?id=[stream_id]      gets the stream identified by [stream_id]
*/

//import { Router, Request, Response } from 'express';
import * as express from 'express';
import { Util } from '../util/util';
import { FFMPEG } from '../util/ffmpeg';
import * as path from 'path';
let ffmpeg = FFMPEG.instance;

// Assign router to the express.Router() instance
const router: express.Router = express.Router();

router.get('/*.ts',Util.asyncHandler( async (req: express.Request, res: express.Response, next: any) => {
    res.sendFile (path.join (__dirname,'../video',req.url));
}));

//router.use ('/*.ts', express.static ("../video"));

router.get('/:id', Util.asyncHandler( async (req: express.Request, res: express.Response, next: any) => {
    // Extract the name from the request parameters
    let { id } = req.params;
    res.sendFile (path.join (__dirname,"../video",id+".m3u8"));
    ffmpeg.ping ();
}));

// Export the express.Router() instance to be used by server.ts
export const StreamController: express.Router = router;