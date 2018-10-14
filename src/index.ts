"use strict"
// Import everything from express and assign it to the express variable
import * as express from 'express';
import * as path from 'path';
// Import WelcomeController from controllers entry point
import {TVController} from './controllers';
import { FFMPEG } from './ffmpeg';
let ffmpeg = FFMPEG.instance;

// Create a new express application instance
const app: express.Application = express();
// The port the express app will listen on
const port: number = Number(process.env.PORT) || 8080;

// Mount the TVController at the /tv route
app.use('/video/:file',function (req, res, next) {
    if (req.params.file == "playlist.m3u8") {
        ffmpeg.ping ();
    }
    next();
})
app.use('/video',express.static(path.join (__dirname,'video')));
app.use('/tv', TVController);

// Serve the application at the given port
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});