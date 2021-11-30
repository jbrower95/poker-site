"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const deck_1 = require("./deck");
const consts_1 = require("./shared/consts");
exports.Profile = mongoose_1.model('Profile', new mongoose_1.Schema({
    startingStack: { type: mongoose_1.Schema.Types.Number, default: 0 },
    username: { type: mongoose_1.Schema.Types.String, required: true },
    email: { type: mongoose_1.Schema.Types.String, required: true },
    pin: { type: mongoose_1.Schema.Types.String, required: true },
    salt: { type: mongoose_1.Schema.Types.String, required: true },
    token: { type: mongoose_1.Schema.Types.String },
    created: mongoose_1.Schema.Types.Date,
    last_active: mongoose_1.Schema.Types.Date,
    hands_played: { type: mongoose_1.Schema.Types.Number, default: 0 }
}));
exports.BetData = new mongoose_1.Schema({
    amount: mongoose_1.Schema.Types.Number,
    is_all_in: mongoose_1.Schema.Types.Boolean,
}, {
    _id: false
});
exports.Player = new mongoose_1.Schema({
    profile: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Profile' },
    seat: mongoose_1.Schema.Types.Number,
    stack: mongoose_1.Schema.Types.Number,
    cards: [mongoose_1.Schema.Types.String],
    activePot: { type: mongoose_1.Schema.Types.Number, default: 0 },
    activeBet: { type: mongoose_1.Schema.Types.Number, default: 0 },
    hasAction: mongoose_1.Schema.Types.Boolean,
    lastAction: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event' },
    inHand: { type: mongoose_1.Schema.Types.Boolean, default: false },
    folded: { type: mongoose_1.Schema.Types.Boolean, default: false }
}, {
    _id: false
});
exports.EventBetData = new mongoose_1.Schema({
    bet_amount: mongoose_1.Schema.Types.Number,
    is_all_in: mongoose_1.Schema.Types.Boolean
}, {
    _id: false
});
exports.EventMinimalProfileModel = new mongoose_1.Schema({
    id: mongoose_1.Schema.Types.String,
    seat: mongoose_1.Schema.Types.Number,
    username: mongoose_1.Schema.Types.String
}, {
    _id: false
});
exports.EventHandStatePlayerModel = new mongoose_1.Schema({
    profile: exports.EventMinimalProfileModel,
    stackSize: mongoose_1.Schema.Types.Number,
    folded: mongoose_1.Schema.Types.Number,
    inHand: mongoose_1.Schema.Types.Number,
    activeBet: mongoose_1.Schema.Types.Number,
    lastAction: mongoose_1.Schema.Types.String
}, {
    _id: false
});
exports.EventPotModel = new mongoose_1.Schema({
    size: mongoose_1.Schema.Types.Number,
    participants: [mongoose_1.Schema.Types.String],
    winners: [mongoose_1.Schema.Types.String]
}, {
    _id: false
});
exports.EventHandStateData = new mongoose_1.Schema({
    players: [exports.EventHandStatePlayerModel],
    communityCards: [mongoose_1.Schema.Types.String],
    pots: [exports.EventPotModel],
    nextSpeaker: mongoose_1.Schema.Types.Number,
    state: mongoose_1.Schema.Types.Number,
}, {
    _id: false
});
exports.EventCardData = new mongoose_1.Schema({
    cards: [mongoose_1.Schema.Types.String]
}, {
    _id: false
});
exports.EventWelcomeData = new mongoose_1.Schema({
    is_host: mongoose_1.Schema.Types.Boolean,
    server_version: mongoose_1.Schema.Types.Number
}, {
    _id: false
});
exports.EventData = new mongoose_1.Schema({
    bet_data: exports.EventBetData,
    state_data: exports.EventHandStateData,
    card_data: exports.EventCardData,
    welcome_data: exports.EventWelcomeData
}, {
    _id: false
});
exports.Event = mongoose_1.model('Event', new mongoose_1.Schema({
    name: mongoose_1.Schema.Types.String,
    audience: mongoose_1.Schema.Types.String,
    hand: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hand' },
    seq_id: mongoose_1.Schema.Types.Number,
    origin: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Profile' },
    data: exports.EventData,
}));
const Pot = new mongoose_1.Schema({
    number: mongoose_1.Schema.Types.Number,
    size: mongoose_1.Schema.Types.Number,
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' }],
    requires_runout: { type: mongoose_1.Schema.Types.Boolean, default: false },
    winners: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Player' }]
});
exports.Hand = mongoose_1.model('Hand', new mongoose_1.Schema({
    creationTime: mongoose_1.Schema.Types.Date,
    event_counter: { type: mongoose_1.Schema.Types.Number, default: 0 },
    events: { type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Event' }], default: [] },
    table: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Table', required: true },
    activeBet: { type: mongoose_1.Schema.Types.Number, default: 0 },
    players: [exports.Player],
    button: mongoose_1.Schema.Types.Number,
    state: { type: mongoose_1.Schema.Types.Number, default: consts_1.GameState.UNINITIALIZED },
    pots: [Pot],
    deck: {
        type: mongoose_1.Schema.Types.String,
        required: true,
        get: (val) => val ? deck_1.Deck.fromSerialization(val) : null,
        set: (deck) => deck.serialize()
    },
    communityCards: [mongoose_1.Schema.Types.String],
    nextSpeaker: mongoose_1.Schema.Types.Number,
}, { toJSON: { getters: false /* disable because of the custom deck getter */ } }));
const TableConfig = new mongoose_1.Schema({
    smallBlind: mongoose_1.Schema.Types.Number,
    bigBlind: mongoose_1.Schema.Types.Number,
    game: mongoose_1.Schema.Types.Number
});
exports.Table = mongoose_1.model('Table', new mongoose_1.Schema({
    host: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Profile' },
    inviteCode: mongoose_1.Schema.Types.String,
    seats: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Profile' }],
    hand_ids: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Hand' }],
    config: TableConfig,
    currentHand: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Hand' }
}));
//# sourceMappingURL=schema.js.map