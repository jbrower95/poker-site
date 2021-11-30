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
const express_1 = __importDefault(require("express"));
const schema_1 = require("../schema");
const consts_1 = require("../shared/consts");
const utils_1 = require("./utils");
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
exports.routes = express_1.default.Router();
exports.routes.use(utils_1.authRequired); // all routes on this endpoint require authentication.
function genUniqueInviteCode(maxAttempts = 10) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < maxAttempts; i++) {
            // TODO(security): We may need more ids than this.
            const inviteCode = crypto_random_string_1.default({ length: 5, type: 'distinguishable' });
            // see if this exists.
            const inUse = yield schema_1.Table.exists({
                inviteCode
            });
            // TODO(correctness)- This is a medium-danger race condition. These ids may clash.
            if (!inUse) {
                return inviteCode;
            }
        }
        throw new Error('Failed to generate invite code.');
    });
}
/**
 * Create a new table, with the current logged in user as the host.
 */
exports.routes.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield utils_1.getLoggedInUser(req);
    const config = req.body.config;
    if (config.game !== consts_1.GameType.HOLDEM) {
        throw new Error(`Unknown game type ${config.game} specified.`);
    }
    if (config.bigBlind <= 0 || config.smallBlind <= 0 || config.bigBlind < config.smallBlind) {
        throw new Error(`Invalid blinds specified.`);
    }
    const code = yield genUniqueInviteCode();
    const table = new schema_1.Table({
        host: user._id,
        seats: [],
        hand_ids: [],
        config,
        inviteCode: code
    });
    yield table.save();
    const tableObj = {
        host: user.id,
        id: table.id,
        config,
        seats: table.seats.map((seat) => seat.toString()),
        inviteCode: code
    };
    res.send({ success: true, table: tableObj });
}));
//# sourceMappingURL=game.js.map