"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consts_1 = require("./api/shared/consts");
class Actions {
    constructor(player, hand) {
        this.player = player;
        this.hand = hand;
    }
    static fromString(data) {
        const contents = JSON.parse(data);
        return Object.assign({}, contents);
    }
    static forPlayer(player, hand) {
        return new Actions(player, hand);
    }
    withBetData(name, data) {
        return {
            type: name,
            table: this.hand.table,
            data,
            origin: this.player.profile.valueOf().toString()
        };
    }
    check() {
        return this.withBetData(consts_1.ActionNames.CHECK, null);
    }
    call() {
        return this.withBetData(consts_1.ActionNames.CALL, null);
    }
    fold() {
        return this.withBetData(consts_1.ActionNames.FOLD, null);
    }
    bet(amount, isAllIn = false) {
        return this.withBetData(consts_1.ActionNames.BET, {
            amount,
            is_all_in: isAllIn
        });
    }
}
exports.Actions = Actions;
//# sourceMappingURL=actions.js.map