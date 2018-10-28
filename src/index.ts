"use strict"

/*
GET     /channels                   returns all the channels in the configured bouquet
POST    /tune?name=[channelname]    tunes to the channel identified by [channelname], returns a [stream_id]
GET     /stream?id=[stream_id]      gets the stream identified by [stream_id]
*/

// Import everything from express and assign it to the express variable
import * as express from 'express';

// Import from controllers entry point
import {ChannelController} from './controllers/channel';
import {StreamController} from './controllers/stream';
import {TuneController} from './controllers/tune';

// Create a new express application instance
const app: express.Application = express();
// The port the express app will listen on
const port: number = Number(process.env.PORT) || 8080;

app.use(express.json());
app.use('/tune', TuneController);
app.use('/channels', ChannelController);
app.use('/stream', StreamController);

// Serve the application at the given port
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});