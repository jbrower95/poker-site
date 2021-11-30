// const express = require('express');
import express from 'express';
import libExpressWs from 'express-ws';
import WebSocket from 'ws';
import {nowMilliseconds} from './utils';
import {redis, db} from './api/db';
import sourceMapSupport from 'source-map-support';
import cookieParser from 'cookie-parser';

sourceMapSupport.install();

const app = express();
app.use(express.json({type: 'application/json'}));
app.use(cookieParser());
const expressWs = libExpressWs(app, null, {wsOptions: {clientTracking: true}});

import { router } from "./routes";

const PING_FREQUENCY_MS = 2000;

// register all endpoints.
app.use('/', router);

function heartbeat(): void {
  // implicitly, 'this' is the websocket received on.
  this.isAlive = true;
  this.lastPong = nowMilliseconds();
}
//
expressWs.getWss().on('connection', (ws: WebSocket) => {
  console.log('[global-ws] Registered new connection');
  // @ts-ignore: keep-alive hack.
  ws.isAlive = true;
  ws.on('pong', heartbeat);
});

// every so often, check through all clients
// and remove the dead ones.
const interval = setInterval(function ping() {
  expressWs.getWss().clients.forEach(function each(ws) {
    // @ts-ignore: keep-alive hack.
    if (ws.isAlive === false) {
      console.log('[global-ws] Pruned client.');
      return ws.terminate();
    }
    // @ts-ignore: keep-alive hack.
    ws.isAlive = false;
    /*tslint:disable:no-empty */
    ws.ping(() => {} /* no op */);
    /*tslint:enable:no-empty */
  });
}, PING_FREQUENCY_MS);

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

const cleanUp = async (done) => {
  clearInterval(interval);

  redis.disconnect();
  await db.close();
  server.close(done);
}

module.exports = {app, server, cleanUp};
