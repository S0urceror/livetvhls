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
const cross_fetch_1 = require("cross-fetch");
const xml2js = require("xml2js");
const util_1 = require("../util/util");
const arguments_1 = require("../util/arguments");
let args = arguments_1.ARGUMENTS.instance;
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
class VuSolo {
    constructor() {
        this._services = new Array();
        this._bouquets = new Array();
        this.getServices();
    }
    get services() {
        return this._services;
    }
    getSRefOfBouquet(name) {
        var sRef = "";
        for (let e2service of this._bouquets) {
            if (e2service.e2servicename == name) {
                sRef = e2service.e2servicereference;
                break;
            }
        }
        return sRef;
    }
    getSRefOfService(name) {
        var sRef = "";
        for (let e2service of this._services) {
            if (e2service.e2servicename == name) {
                sRef = e2service.e2servicereference;
                break;
            }
        }
        return sRef;
    }
    getServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var response = yield cross_fetch_1.default('http://' + args.satReceiver + '/web/getservices');
                var text = yield response.text();
                var result = yield asyncParseXML2JS(text);
                this._bouquets = result.e2servicelist.e2service;
                console.log(`Found ${this._bouquets.length} bouquets`);
                let sRef = this.getSRefOfBouquet(args.defaultBouquet);
                if (sRef.length == 0) {
                    console.log("Bouquet with that name does not exist!");
                    return;
                }
                let name = this._bouquets[0].e2servicename;
                console.log(`Using bouquet [${name}]`);
                response = yield cross_fetch_1.default('http://' + args.satReceiver + '/web/getservices?sRef=' + sRef);
                text = yield response.text();
                result = yield asyncParseXML2JS(text);
                this._services = result.e2servicelist.e2service;
                console.log(`Found ${this._services.length} services in [${name}]`);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
}
exports.VuSolo = VuSolo;
const router = express_1.Router();
const vusolo = VuSolo.instance;
router.get('/', util_1.Util.asyncHandler((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    res.send(JSON.stringify(vusolo.services, undefined, 2));
})));
exports.ChannelController = router;
//# sourceMappingURL=channel.js.map