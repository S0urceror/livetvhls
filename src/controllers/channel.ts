"use strict"

/*
GET     /channels                   returns all the channels in the configured bouquet
*/

// Import only what we need from express
import { Router, Request, Response } from 'express';
import fetch from "cross-fetch";
import * as xml2js from "xml2js";
import { Util } from '../util/util';
import { ARGUMENTS } from '../util/arguments';
let args = ARGUMENTS.instance;

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

export class VuSolo {
    private static _instance: VuSolo;
    private _services: Array<any> = new Array();
    private _bouquets: Array<any> = new Array();
    
    public get services () {
        return this._services;
    }

    getSRefOfBouquet (name: string) : string {
        var sRef:string = "";
        for (let e2service of this._bouquets) {
            if (e2service.e2servicename==name) {
                sRef = e2service.e2servicereference;
                break;
            }
        }
        return sRef;
    }
    getSRefOfService (name: string) : string {
        var sRef:string = "";
        for (let e2service of this._services) {
            if (e2service.e2servicename==name) {
                sRef = e2service.e2servicereference;
                break;
            }
        }
        return sRef;
    }

    // get all services from vusolo2
    async getServices () {
        try {
            var response = await fetch ('http://'+args.satReceiver+'/web/getservices');
            var text:string = await response.text();
            var result = await asyncParseXML2JS (text);
            this._bouquets = result.e2servicelist.e2service;
            console.log(`Found ${this._bouquets.length} bouquets`);

            let sRef : string = this.getSRefOfBouquet (args.defaultBouquet);
            if (sRef.length==0) {
                console.log ("Bouquet with that name does not exist!");
                return;
            }
            let name = this._bouquets[0].e2servicename;
            console.log(`Using bouquet [${name}]`);

            response = await fetch ('http://'+args.satReceiver+'/web/getservices?sRef='+sRef);
            text = await response.text();
            result = await asyncParseXML2JS (text);
            this._services = result.e2servicelist.e2service;
            console.log(`Found ${this._services.length} services in [${name}]`);
        }
        catch (e) {
            console.log (e);
        }
    }

    constructor () {
        this.getServices ();
    }

    // get the singleton instance containing all channels
    public static get instance()
    {
        return this._instance || (this._instance = new this());
    }
}

// Assign router to the express.Router() instance
const router: Router = Router();

// create the singleton Vusolo instance
const vusolo: VuSolo = VuSolo.instance;

// The / here corresponds to the route that the TVController is mounted on in the server.ts file.
router.get('/', Util.asyncHandler( async (req: Request, res: Response, next: any) => {
    // Reply with a hello world when no name param is provided
    res.send(JSON.stringify(vusolo.services,undefined,2));
}));

// Export the express.Router() instance to be used by server.ts
export const ChannelController: Router = router;