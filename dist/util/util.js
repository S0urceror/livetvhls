"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncExpressHandler = fn => (req, res, next) => Promise
    .resolve(fn(req, res, next))
    .catch(next);
class Util {
    static get asyncHandler() {
        return asyncExpressHandler;
    }
}
exports.Util = Util;
//# sourceMappingURL=util.js.map