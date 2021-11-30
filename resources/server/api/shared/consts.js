"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameType = Object.freeze({
    HOLDEM: 0,
});
exports.GameState = Object.freeze({
    UNINITIALIZED: -1,
    PREFLOP: 0,
    POSTFLOP: 1,
    POSTTURN: 2,
    POSTRIVER: 3,
    SHOWDOWN: 4,
});
exports.ActionStatus = Object.freeze({
    PENDING: 0,
    ACCEPTED: 1,
    FAILED: -1 /* there was a problem validating the action. */
});
exports.ErrorCodes = Object.freeze({
    CLOSE_NORMAL: 1000,
    CLOSE_GOING_AWAY: 1001,
    UNSUPPORTED_PAYLOAD: 1007,
    INVALID_AUTH: 4006,
    NO_SUCH_HAND: 4007,
    NOT_PERMITTED: 4008,
    NO_SUCH_TABLE: 4009
});
exports.ActionNames = Object.freeze({
    /* poker actions*/
    CALL: 'call',
    FOLD: 'fold',
    BET: 'bet',
    CHECK: 'check',
    ALL_IN: 'all-in',
    /* control events */
    WELCOME: 'welcome',
    INFO: 'info',
    JOIN: 'join',
    ACCEPT_JOIN: 'accept_join',
    /* authentication events */
    INVALID_AUTH: 'invalid_auth',
    INVALID_PERMISSION: 'invalid_permission',
    /* table events */
    REQUEST_START_HAND: 'request_start_hand',
    ACCEPT_HAND: 'accept_hand',
    SKIP_HAND: 'skip_hand',
    CHIPS: 'chips',
    ACCEPT_CHIPS: 'request_chips_accept',
    LEAVE: 'leave'
});
// actions that only the host can perform.
exports.HostActionNames = [
    exports.ActionNames.ACCEPT_CHIPS,
    exports.ActionNames.REQUEST_START_HAND,
    exports.ActionNames.ACCEPT_JOIN
];
exports.EventNames = Object.freeze({
    // indicating that anyone wanting to join at the start of the hand should reply
    // with ACCEPT_HAND action.
    START_HAND: 'start_hand',
    // indicating that a hand will begin, with all relevant information.
    HAND_BEGIN: 'hand_begin',
    // indicating that the hand has ended, with all relevant state.
    HAND_END: 'hand_end',
    // indicating that the client who receives this is expected to reply with an
    // action to take, by some deadline.
    REQUEST_ACTION: 'request_action',
    // informing the cards dealt privately.
    DEAL: 'deal',
    // a full snapshot of the current state of the hand.
    HAND_STATE: 'hand_state',
    // informing the cards dealt on the flop / turn / river.
    FLOP: 'flop',
    TURN: 'turn',
    RIVER: 'river',
    // indicating that a chips request has been placed, and the reciever (a host) should approve.
    VERIFY_CHIPS_REQUEST: 'verify_chips_request',
    // indicating that a player has left.
    LEAVE: 'leave'
});
//# sourceMappingURL=consts.js.map