"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const channel_1 = require("./controllers/channel");
const stream_1 = require("./controllers/stream");
const tune_1 = require("./controllers/tune");
const app = express();
const port = Number(process.env.PORT) || 8080;
app.use(express.json());
app.use('/tune', tune_1.TuneController);
app.use('/channels', channel_1.ChannelController);
app.use('/stream', stream_1.StreamController);
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});
//# sourceMappingURL=index.js.map