export const GameType = Object.freeze({
  HOLDEM: 0,
  // TODO: add new game types.
});

export const GameState = Object.freeze({
  UNINITIALIZED: -1, /* waiting */
  PREFLOP: 0, /* during preflop betting. */
  POSTFLOP: 1, /* during postflop betting */
  POSTTURN: 2, /* during turn betting */
  POSTRIVER: 3, /* during river betting*/
  SHOWDOWN: 4, /* showdown (end) */
});

export const ActionStatus = Object.freeze({
    PENDING: 0, /* this action needs to be picked up + processed by a worker. */
    ACCEPTED: 1, /* this action was validated + an event has been issued. */
    FAILED: -1 /* there was a problem validating the action. */
});

export const ErrorCodes = Object.freeze({
  CLOSE_NORMAL: 1000,
  CLOSE_GOING_AWAY: 1001,
  UNSUPPORTED_PAYLOAD: 1007,
  INVALID_AUTH: 4006,
  NO_SUCH_HAND: 4007,
  NOT_PERMITTED: 4008,
  NO_SUCH_TABLE: 4009
});


export const ActionNames = Object.freeze({
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
export const HostActionNames = [
  ActionNames.ACCEPT_CHIPS,
  ActionNames.REQUEST_START_HAND,
  ActionNames.ACCEPT_JOIN
];

export const EventNames = Object.freeze({
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
