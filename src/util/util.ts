"use strict"

const asyncExpressHandler = fn => (req, res, next) =>
    Promise
        .resolve(fn(req, res, next))
        .catch(next)

export class Util {
    // enable the use of await in Express routes
    public static get asyncHandler () {
        return asyncExpressHandler;
    }
}