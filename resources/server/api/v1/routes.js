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
const consts_1 = require("../shared/consts");
const events_1 = require("../../events");
const actions_1 = require("../../actions");
const game_1 = require("../game");
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const schema_1 = require("../schema");
const profile_1 = require("./profile");
const game_2 = require("./game");
const hand_1 = require("./hand");
const utils_1 = require("./utils");
exports.routes = express_1.default.Router();
exports.routes.use('/table', game_2.routes);
exports.routes.use('/hand', hand_1.routes);
exports.routes.use('/profile', profile_1.routes);
function flushEvents(game) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableId = game.table.id;
        const events = game.queuedEvents; // push out redis notifications.
        if (events.length > 0) {
            console.log(`[game:${tableId}] Flushing ${events.length} events.`);
            const pipeline = db_1.redis.pipeline();
            events.forEach((event) => {
                // alert all hosts listening to this table of the event(s).
                pipeline.publish(tableId, JSON.stringify(event.toJSON()));
                // alert all players at this server.
                broadcast(tableId, event);
            });
            // upload all of these events to redis.
            yield pipeline.exec();
        }
    });
}
function didReceiveMessageForSocket(ws, msg, req) {
    return __awaiter(this, void 0, void 0, function* () {
        // decrypt the event.
        msg = msg.toString();
        if (msg.charAt(0) === '{') {
            const action = actions_1.Actions.fromString(msg);
            /* validate the event. */
            const user = yield utils_1.getLoggedInUser(req);
            if (!user) {
                return;
            }
            const tableInviteCode = req.query.table;
            if (!tableInviteCode) {
                sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user.id).notPermitted('Bad request. Got no invite code.'), user.id);
                ws.close(consts_1.ErrorCodes.NO_SUCH_TABLE);
                return;
            }
            const table = yield schema_1.Table.findOne({ inviteCode: tableInviteCode });
            if (!table) {
                sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user.id).notPermitted(`No table with this invite code ${tableInviteCode} available.`), user.id);
                ws.close(consts_1.ErrorCodes.NO_SUCH_TABLE);
                return;
            }
            // see if the user needs to be a host for this action.
            if (consts_1.HostActionNames.indexOf(action.type) >= 0) {
                if (user.id !== table.host.valueOf().toString()) {
                    sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user.id).notPermitted('This action can only be performed by the host.'), user.id);
                    return;
                }
            }
            // general table event.
            switch (action.type) {
                case consts_1.ActionNames.WELCOME:
                    console.log(`[wss] ${user.username} said welcome!`);
                    const isHost = user.id === table.host.valueOf().toString();
                    sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user.id).welcome(`Welcome back, ${user.username}!`, isHost), user.id);
                    break;
                case consts_1.ActionNames.REQUEST_START_HAND: {
                    console.log(`[wss] ${user.username} would like to start a hand.`);
                    const game = yield game_1.Game.newHand(table);
                    yield game.begin();
                    yield game.save();
                    yield flushEvents(game);
                    break;
                }
                case consts_1.ActionNames.LEAVE: {
                    console.log(`[wss] ${user.username} left the table (out of turn fold).`);
                    if (table.currentHand) {
                        const hand = yield schema_1.Hand.findById(table.currentHand);
                        const participant = hand.players.find((p) => p.profile && p.profile.equals(user.id));
                        if (participant && participant.inHand) {
                            // fold the player.
                            participant.folded = true;
                            participant.inHand = false;
                            hand.markModified('players');
                            yield hand.save();
                        }
                    }
                    // unseat the player.
                    for (let i = 0; i < table.seats.length; i++) {
                        if (table.seats[i] && table.seats[i].valueOf().toString() === user.id) {
                            table.seats[i] = null;
                            break;
                        }
                    }
                    table.markModified('seats');
                    yield table.save();
                    broadcast(table.id, events_1.Events.forAll().leftTable(user.id));
                    break;
                }
                default: {
                    console.log(`[wss] ${user.username} said ${action.type}!`);
                    // pass this on to the current hand.
                    if (table.currentHand) {
                        const hand = yield schema_1.Hand.findById(table.currentHand);
                        if (!hand || hand.state === consts_1.GameState.SHOWDOWN || hand.state === consts_1.GameState.UNINITIALIZED) {
                            sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user.id).invalidAuth('An active hand could not be found.'), user.id);
                            ws.close(consts_1.ErrorCodes.NO_SUCH_HAND);
                            return;
                        }
                        // make sure that this player is actually in the hand.
                        if (!hand.players.find(player => {
                            var _a;
                            return ((_a = player.profile) === null || _a === void 0 ? void 0 : _a.valueOf().toString()) === user.id;
                        })) {
                            // player not found
                            sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user.id).notPermitted(`${user.username}: you are not part of this hand.'`), user.id);
                            ws.close(consts_1.ErrorCodes.NOT_PERMITTED);
                            return;
                        }
                        // submit the action to mongodb.
                        const game = yield game_1.Game.fromHandId(hand._id);
                        yield game.processAction(action);
                        yield game.save();
                        yield flushEvents(game);
                    }
                }
            }
        }
    });
}
const TABLE_CONNECTION_QUEUE = {};
// what players at each table?
const TABLE_REGISTRY = {};
// what table is each player sitting at?
const PLAYER_REGISTRY = {};
function sendEvent(ws, event, userId) {
    const contents = JSON.stringify(event);
    try {
        ws.send(contents);
    }
    catch (error) {
        console.error('Error flushing event. Disconnecting user.');
        console.error(error);
        if (userId) {
            unregisterPlayer(userId);
        }
    }
}
exports.sendEvent = sendEvent;
function broadcast(table, event) {
    const players = TABLE_REGISTRY[table];
    if (!players) {
        console.log(`No players seated at table ${table} for broadcast.`);
        return;
    }
    const audience = event.audience;
    if (!audience) {
        console.error(`No audience on event ${event.name}`);
        return;
    }
    let targets = [];
    if (audience === 'all') {
        targets = targets.concat(Object.keys(players));
    }
    else {
        targets = event.audience.split(',');
    }
    for (const target of targets) {
        const ws = players[target];
        sendEvent(ws, event, target);
    }
}
exports.broadcast = broadcast;
function beginObservingTable(table) {
    return __awaiter(this, void 0, void 0, function* () {
        if (TABLE_REGISTRY[table]) {
            // already observing.
            console.log('[events] Already subscribed to this table.');
            return Promise.resolve(true);
        }
        else {
            console.log('[events] Setting up subscription..');
        }
        const promise = TABLE_CONNECTION_QUEUE[table];
        if (promise) {
            console.log('[events] Subscription was already in flight.');
            // request in flight.
            return yield TABLE_CONNECTION_QUEUE[table];
        }
        TABLE_REGISTRY[table] = {};
        const tableId = 'table:' + table;
        console.log(`[events] Server subscribing to table: ${table}`);
        const p = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            db_1.redis.subscribe(tableId, (err, count) => {
                // null-out in flight request.
                TABLE_CONNECTION_QUEUE[table] = null;
                if (err) {
                    console.error(`[events] Server failed to subscribe to ${tableId} (total subscriptions: ${count})`);
                    console.error(err);
                    resolve(false);
                    return false;
                }
                console.log(`[events] Server successfully subscribed to ${tableId} (total subscriptions: ${count})`);
                resolve(true);
                return true;
            });
        }));
        TABLE_CONNECTION_QUEUE[table] = p;
        return yield p;
    });
}
function registerPlayer(ws, id, tableId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (PLAYER_REGISTRY[id]) {
            // TODO(correctness): Should we just unregister here?
            console.error(`Player was already seated at table ${PLAYER_REGISTRY[id]}`);
            unregisterPlayer(id);
        }
        PLAYER_REGISTRY[id] = tableId;
        const tableObj = TABLE_REGISTRY[tableId];
        if (!tableObj) {
            // this table isn't being watched on this server. create an entry.
            const success = yield beginObservingTable(tableId);
            if (!success) {
                throw new Error(`Failed to observe table ${tableId}.`);
            }
        }
        else {
            console.log(`[events] Already subscribed to ${tableId}`);
        }
        // seat the player.
        TABLE_REGISTRY[tableId][id] = ws;
        console.log(`Player ${id} was registered at table ${tableId}`);
    });
}
function redisKeyForTable(table) {
    return 'table:' + table;
}
function unregisterPlayer(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableId = PLAYER_REGISTRY[user];
        if (!tableId) {
            // wasn't already seated.
            console.error(`[player] ${user} was not seated at a table. Nothing to do.`);
            return;
        }
        // remove the entry.
        delete PLAYER_REGISTRY[user];
        const tableObj = TABLE_REGISTRY[tableId];
        if (tableObj[user]) {
            console.log(`Unseated user with id ${user} from table ${tableId}`);
            delete tableObj[user];
        }
        // clean up the table.
        if (Object.keys(tableObj).length === 0) {
            // can unsubscribe.
            const tid = redisKeyForTable(tableId);
            yield db_1.redis.unsubscribe(tid);
            console.log(`Cleaned up subscription to ${tid}`);
        }
    });
}
db_1.redis.on("message", (channel, message) => {
    if (channel.startsWith('table:')) {
        // this is a table event broadcast. send to all clients.
        const tid = channel.slice(6);
        const event = events_1.Events.fromString(message);
        broadcast(tid, event);
        console.log(`Table[${tid}]: Re-broadcasted event ${event.name} to ${event.audience} participants.`);
    }
});
function onReceiveNewPlayer(ws, r) {
    return __awaiter(this, void 0, void 0, function* () {
        // opened a new connection.
        const user = r.query.user;
        const token = r.query.token;
        const table = r.query.table;
        console.log(`[wss] Got new request to seat user (id): ${user} at table ${table}`);
        // valid user token.
        const valid = yield utils_1.validateToken(user, token, ws);
        if (!valid) {
            sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user).invalidAuth(`Incorrect token received ${token}.`), null);
            ws.close(consts_1.ErrorCodes.NOT_PERMITTED);
            return;
        }
        // seat the user at the table.
        const mTable = yield schema_1.Table.findOne({ inviteCode: table });
        console.log(`[wss] Seating ${valid.username}`);
        // see if you're sitting already.
        if (mTable.seats && mTable.seats.length === 8) {
            let isSeated = !!mTable.seats.find((playerId) => {
                return playerId !== null && (playerId.valueOf().toString() === valid.id);
            });
            if (!isSeated) {
                // add the player into this seat chart.
                for (let i = 0; i < mTable.seats.length; i++) {
                    if (!mTable.seats[i]) {
                        mTable.seats[i] = valid.id;
                        console.log(`Seated player ${valid.username} at seat ${i + 1}`);
                        isSeated = true;
                        break;
                    }
                }
                if (!isSeated) {
                    console.error('[seating] No seats available for this player.');
                    sendEvent(ws, events_1.Events.controlEventForPlayerWithId(user).notPermitted(`No room left at table.`), null);
                    ws.close(consts_1.ErrorCodes.NOT_PERMITTED);
                    return;
                }
            }
            else {
                console.error(`${valid.username} was already seated.`);
            }
        }
        else {
            mTable.seats = [null, null, null, null, null, null, null, null];
            mTable.seats[0] = valid.id;
            console.log(`Created new seats + put player ${valid.username} at seat 1`);
        }
        console.log(`Updated Table seats: ${JSON.stringify(mTable.seats)}`);
        mTable.markModified('seats'); // because it's an array, we have to say that it's been updated.
        yield mTable.save();
        console.log('Saved!');
        // register this connection.
        yield registerPlayer(ws, valid.id, mTable.id);
        return valid;
    });
}
/*
 * Streaming endpoint.
 */
exports.routes.ws('/stream', (wss, req) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[wss] Got stream request.');
    const user = yield onReceiveNewPlayer(wss, req);
    wss.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        didReceiveMessageForSocket(wss, msg, req);
    }));
    wss.on('close', (ws, _req) => __awaiter(void 0, void 0, void 0, function* () {
        // unsubscribe this user.
        console.log('[wss] conn closed');
        yield unregisterPlayer(user.id);
    }));
    wss.on('error', (ws, err) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[wss] conn error: ');
        console.error(err);
    }));
}));
//# sourceMappingURL=routes.js.map