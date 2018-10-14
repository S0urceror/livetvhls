"use strict"
// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as empty from 'empty-folder';
import fetch from "cross-fetch";
import * as xml2js from "xml2js";
import { FFMPEG } from '../ffmpeg';
let ffmpeg = FFMPEG.instance;
import { ARGUMENTS } from '../arguments';
let args = ARGUMENTS.instance;
import * as delay from 'delay';

// http://vusolo2.lan/web/getservices
// <e2servicelist>
//      <e2service>
//          <e2servicereference>
//              1:7:1:0:0:0:0:0:0:0:FROM BOUQUET "userbouquet.favourites-hd.tv" ORDER BY bouquet
//          </e2servicereference>
//          <e2servicename>Favorieten HD 10-04-2015</e2servicename>
//      </e2service>
//      <e2service>
//      ...
// http://vusolo2.lan/web/getservices?sRef=1:7:1:0:0:0:0:0:0:0:FROM%20BOUQUET%20%22userbouquet.favourites-hd.tv%22%20ORDER%20BY%20bouquet
// <e2servicelist>
//      <e2service>
//          <e2servicereference>1:64:1:0:0:0:0:0:0:0::-- CD Standaardzenders --</e2servicereference>
//          <e2servicename>-- CD Standaardzenders --</e2servicename>
//      </e2service>
//      <e2service>
//          <e2servicereference>1:0:19:5225:C99:3:EB0000:0:0:0:</e2servicereference>
//          <e2servicename>NPO1 HD</e2servicename>
//      </e2service>
//      <e2service>
//          <e2servicereference>1:0:19:17C0:C82:3:EB0000:0:0:0:</e2servicereference>
//          <e2servicename>NPO2 HD</e2servicename>
//      </e2service>
// ffmpeg -i http://vusolo2.lan:8001/1:0:19:5225:C99:3:EB0000:0:0:0: -vcodec copy -acodec copy -map 0:0 -map 0:1 -f hls -hls_segment_filename 'out%03d.ts' -hls_flags delete_segments playlist.m3u8

var services: Array<any>;
var bouquets: Array<any>;
////////////////////////////////////////////////////////////////
// Helper functions to turn callback style into Promises
//

// turn XML string into it's JS object representation
async function asyncParseXML2JS (text:string): Promise <any> {
    return new Promise ((resolve, reject) => {
        xml2js.parseString (text, (err,result) => {
            if (err) reject (err)
            else resolve (result);
        });
    });
}
// enable the use of await in Express routes
const asyncExpressHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(next)
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
async function asyncWaitFileCreated (path: string, filename: string) : Promise <any> {
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
            if (event=="rename" && filename=="playlist.m3u8") {
                clearTimeout (timeout);
                watcher.close();
                resolve (event);
            }
        });
    });
}
// get all services from vusolo2
async function getServices () {
    try {
        var response = await fetch ('http://'+args.satReceiver+'/web/getservices');
        var text:string = await response.text();
        var result = await asyncParseXML2JS (text);
        bouquets = result.e2servicelist.e2service;
        console.log(`Found ${bouquets.length} bouquets`);

        let sRef : string = getSRefOfBouquet (args.defaultBouquet);
        if (sRef.length==0) {
            console.log ("Bouquet with that name does not exist!");
            return;
        }
        let name = bouquets[0].e2servicename;
        console.log(`Using bouquet [${name}]`);

        response = await fetch ('http://'+args.satReceiver+'/web/getservices?sRef='+sRef);
        text = await response.text();
        result = await asyncParseXML2JS (text);
        services = result.e2servicelist.e2service;
        console.log(`Found ${services.length} services in [${name}]`);
    }
    catch (e) {
        console.log (e);
    }
}
function getSRefOfBouquet (name: string) : string {
    var sRef:string = "";
    for (let e2service of bouquets) {
        if (e2service.e2servicename==name) {
            sRef = e2service.e2servicereference;
            break;
        }
    }
    return sRef;
}
function getSRefOfService (name: string) : string {
    var sRef:string = "";
    for (let e2service of services) {
        if (e2service.e2servicename==name) {
            sRef = e2service.e2servicereference;
            break;
        }
    }
    return sRef;
}

// read all the services from the satellite receiver
getServices ();

// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the TVController is mounted on in the server.ts file.
router.get('/', asyncExpressHandler( async (req: Request, res: Response, next: any) => {
    // Reply with a hello world when no name param is provided
    res.send(JSON.stringify(services,undefined,2));
}));

// route to start the transcoder for a specific channel
var prev_name:string = "";
const m3u8file:string = "playlist.m3u8";
router.get('/:name', asyncExpressHandler( async (req: Request, res: Response, next: any) => {
    // Extract the name from the request parameters
    let { name } = req.params;
    
    var sRef : string = getSRefOfService (name);
    if (sRef.length==0) {
        res.send ("Service with that name does not exist!");
        return;
    }
    if (ffmpeg.isRunning() && name==prev_name) {
        // already transcoding this channel
        //console.log ("Already transcoding "+name);
        res.redirect ("/video/"+m3u8file);
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
        "-f","hls","-hls_segment_filename","segment%02d.ts","-hls_flags","delete_segments",
        m3u8file
    ],video_path);
    await delay (1000);
    // wait for video/playlist.m3u8 to appear
    await asyncWaitFileCreated (video_path,m3u8file);
    prev_name = name;
    //res.sendFile (path.join (video_path,m3u8file));
    res.redirect ("/video/"+m3u8file);
    //console.log ("Redirecting to /video/"+m3u8file);
}));

// Export the express.Router() instance to be used by server.ts
export const TVController: Router = router;