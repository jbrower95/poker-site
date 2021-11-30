"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const express = require('express');
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const utils_1 = require("./utils");
const db_1 = require("./api/db");
const source_map_support_1 = __importDefault(require("source-map-support"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
source_map_support_1.default.install();
const app = express_1.default();
app.use(express_1.default.json({ type: 'application/json' }));
app.use(cookie_parser_1.default());
const expressWs = express_ws_1.default(app, null, { wsOptions: { clientTracking: true } });
const routes_1 = require("./routes");
const PING_FREQUENCY_MS = 2000;
// register all endpoints.
app.use('/', routes_1.router);
function heartbeat() {
    // implicitly, 'this' is the websocket received on.
    this.isAlive = true;
    this.lastPong = utils_1.nowMilliseconds();
}
//
expressWs.getWss().on('connection', (ws) => {
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
        ws.ping(() => { } /* no op */);
        /*tslint:enable:no-empty */
    });
}, PING_FREQUENCY_MS);
// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
const cleanUp = (done) => __awaiter(void 0, void 0, void 0, function* () {
    clearInterval(interval);
    db_1.redis.disconnect();
    yield db_1.db.close();
    server.close(done);
});
module.exports = { app, server, cleanUp };
//# sourceMappingURL=index.js.map