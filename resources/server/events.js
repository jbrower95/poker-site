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
Object.defineProperty(exports, "__esModule", { value: true });
const consts_1 = require("./api/shared/consts");
const schema_1 = require("./api/schema");
const SERVER_VERSION = 0.1;
function stateSnapshotFromHand(hand) {
    return __awaiter(this, void 0, void 0, function* () {
        const usernamesLoader = Promise.all(hand.players.map((player) => __awaiter(this, void 0, void 0, function* () {
            if (player.profile) {
                return yield schema_1.Profile.findById(player.profile);
            }
            else {
                return null;
            }
        })));
        const lastActionsLoader = Promise.all(hand.players.map((player) => __awaiter(this, void 0, void 0, function* () {
            if (player.lastAction) {
                return yield schema_1.Event.findById(player.lastAction);
            }
            else {
                return null;
            }
        })));
        const [usernames, lastActions] = yield Promise.all([usernamesLoader, lastActionsLoader]);
        return {
            players: hand.players.map((player) => {
                var _a, _b;
                return {
                    profile: {
                        id: (_a = player.profile) === null || _a === void 0 ? void 0 : _a.valueOf().toString(),
                        seat: player.seat,
                        username: (_b = usernames[player.seat]) === null || _b === void 0 ? void 0 : _b.username
                    },
                    stackSize: player.stack,
                    folded: player.folded,
                    inHand: player.inHand,
                    activeBet: player.activeBet,
                    lastAction: JSON.stringify(lastActions[player.seat])
                };
            }),
            communityCards: hand.communityCards,
            pots: hand.pots.map((pot) => {
                return {
                    size: pot.size,
                    participants: pot.participants.map((par) => par.valueOf().toString()),
                    winners: pot.winners ? pot.winners.map((winner) => winner.valueOf().toString()) : null
                };
            }),
            nextSpeaker: hand.nextSpeaker,
            state: hand.state,
        };
    });
}
/**
 * Use on the server side to create + issue commands.
 */
class Events {
    constructor(audience, origin) {
        this.origin = origin;
        this.audience = audience;
    }
    static fromPlayer(player) {
        return new Events('all', player.profile.valueOf().toString());
    }
    static forPlayerOnly(player) {
        return new Events(player.profile.valueOf().toString(), 'server');
    }
    static controlEventForPlayerWithId(playerId) {
        return new Events(playerId, 'server');
    }
    static forAll() {
        return new Events('all', 'server');
    }
    static fromString(json) {
        const contents = JSON.parse(json);
        return contents;
    }
    fromData(name, data) {
        return new schema_1.Event({
            origin: this.origin,
            audience: this.audience,
            name,
            data,
        });
    }
    handBegin() {
        return this.fromData(consts_1.EventNames.HAND_BEGIN, null);
    }
    requestAction(target, validUntil) {
        return this.fromData(consts_1.EventNames.REQUEST_ACTION, null);
    }
    state(hand) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fromData(consts_1.EventNames.HAND_STATE, {
                bet_data: null,
                state_data: yield stateSnapshotFromHand(hand)
            });
        });
    }
    deal(cards) {
        return this.fromData(consts_1.EventNames.DEAL, {
            card_data: {
                cards
            }
        });
    }
    call(amount, isAllIn) {
        return this.fromData(consts_1.ActionNames.CALL, {
            bet_data: {
                bet_amount: amount,
                is_all_in: isAllIn
            },
            state_data: null
        });
    }
    check() {
        return this.fromData(consts_1.ActionNames.CHECK, null);
    }
    fold() {
        return this.fromData(consts_1.ActionNames.FOLD, null);
    }
    bet(amount, isAllIn = false) {
        return this.fromData(consts_1.ActionNames.BET, {
            bet_data: {
                bet_amount: amount,
                is_all_in: isAllIn
            },
            state_data: null
        });
    }
    flop(flop) {
        return this.fromData(consts_1.EventNames.FLOP, null);
    }
    turn(turn) {
        return this.fromData(consts_1.EventNames.TURN, null);
    }
    river(river) {
        return this.fromData(consts_1.EventNames.RIVER, null);
    }
    handEnd() {
        return this.fromData(consts_1.EventNames.HAND_END, null);
    }
    invalidAuth(message) {
        return this.controlEvent(consts_1.ActionNames.INVALID_AUTH, message);
    }
    leftTable(user) {
        return this.controlEvent(consts_1.EventNames.LEAVE, user);
    }
    notPermitted(message) {
        return this.controlEvent(consts_1.ActionNames.INVALID_PERMISSION, message);
    }
    welcome(message, isHost) {
        return this.controlEvent(consts_1.ActionNames.WELCOME, message, {
            welcome_data: {
                is_host: isHost,
                server_version: SERVER_VERSION
            }
        });
    }
    controlEvent(name, message, data = null) {
        return {
            name,
            message,
            audience: this.audience,
            data
        };
    }
}
exports.Events = Events;
//# sourceMappingURL=events.js.map