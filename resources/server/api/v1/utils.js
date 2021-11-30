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
const schema_1 = require("../schema");
const events_1 = require("../../events");
const consts_1 = require("../shared/consts");
function validateToken(origin, token, ws) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = yield schema_1.Profile.findById(origin);
        if (token !== profile.token) {
            ws.send(JSON.stringify(events_1.Events.controlEventForPlayerWithId(origin).invalidAuth(`Invalid token '${token}' supplied for user '${origin}' with request.`)));
            ws.close(consts_1.ErrorCodes.INVALID_AUTH);
        }
        return profile;
    });
}
exports.validateToken = validateToken;
function getLoggedInUser(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = req.cookies.user;
        if (!token) {
            return null;
        }
        return yield schema_1.Profile.findOne({ token });
    });
}
exports.getLoggedInUser = getLoggedInUser;
function authRequired(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[INFO] Request from user ${req.cookies.user} (to ${req.originalUrl})`);
        const user = yield getLoggedInUser(req);
        if (!user) {
            res.status(401);
            res.send({ success: false, error: `Unauthorized user.` });
            throw new Error(`User unauthorized. (token ${user})`);
        }
        // call next middleware now that we know we're authenticated.
        next();
    });
}
exports.authRequired = authRequired;
//# sourceMappingURL=utils.js.map