export declare const GameType: Readonly<{
    HOLDEM: number;
}>;
export declare const GameState: Readonly<{
    UNINITIALIZED: number;
    PREFLOP: number;
    POSTFLOP: number;
    POSTTURN: number;
    POSTRIVER: number;
    SHOWDOWN: number;
}>;
export declare const ActionStatus: Readonly<{
    PENDING: number;
    ACCEPTED: number;
    FAILED: number;
}>;
export declare const ErrorCodes: Readonly<{
    CLOSE_NORMAL: number;
    CLOSE_GOING_AWAY: number;
    UNSUPPORTED_PAYLOAD: number;
    INVALID_AUTH: number;
    NO_SUCH_HAND: number;
    NOT_PERMITTED: number;
    NO_SUCH_TABLE: number;
}>;
export declare const ActionNames: Readonly<{
    CALL: string;
    FOLD: string;
    BET: string;
    CHECK: string;
    ALL_IN: string;
    WELCOME: string;
    INFO: string;
    JOIN: string;
    ACCEPT_JOIN: string;
    INVALID_AUTH: string;
    INVALID_PERMISSION: string;
    REQUEST_START_HAND: string;
    ACCEPT_HAND: string;
    SKIP_HAND: string;
    CHIPS: string;
    ACCEPT_CHIPS: string;
    LEAVE: string;
}>;
export declare const HostActionNames: string[];
export declare const EventNames: Readonly<{
    START_HAND: string;
    HAND_BEGIN: string;
    HAND_END: string;
    REQUEST_ACTION: string;
    DEAL: string;
    HAND_STATE: string;
    FLOP: string;
    TURN: string;
    RIVER: string;
    VERIFY_CHIPS_REQUEST: string;
    LEAVE: string;
}>;
