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
const crypto_1 = __importDefault(require("crypto"));
const token_1 = require("../token");
const utils_1 = require("./utils");
function sanitizeModel(profile) {
    return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        pin: null,
        salt: null,
        token: profile.token,
        created: profile.created,
        last_active: profile.last_active,
        hands_played: profile.hands_played,
        startingStack: profile.startingStack
    };
}
function meetsPasswordRequirement(password) {
    // @todo [security] password security policy.
    return (password !== null && password !== undefined &&
        password.length > 6 &&
        password.indexOf(' ') === -1 // no empty spaces
    );
}
function meetsUsernameRequirement(username) {
    // @todo [security] username security policy.
    return (username !== null && username !== undefined &&
        username.length > 6 &&
        username.indexOf(' ') === -1 // no empty spaces
    );
}
function meetsEmailRequirement(email) {
    // @todo [security] actual policy for emails.
    return (email !== null && email !== undefined &&
        email.indexOf('@') !== -1 && // gotta have an @ signs
        email.indexOf(' ') === -1 // no empty spaces
    );
}
function hash(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
exports.routes = express_1.default.Router();
exports.routes.get('/', utils_1.authRequired, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield utils_1.getLoggedInUser(req);
    res.send({
        success: true,
        profile: sanitizeModel(user)
    });
}));
exports.routes.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!meetsPasswordRequirement(req.body.pin)) {
        res.send({ success: false, error: `Password "${req.body.pin}" does not meet security requirements.` });
        res.status(400);
        return;
    }
    if (!meetsUsernameRequirement(req.body.username)) {
        res.send({ success: false, error: 'Invalid username.' });
        res.status(400);
        return;
    }
    if (!meetsEmailRequirement(req.body.email)) {
        res.send({ success: false, error: 'Invalid email.' });
        res.status(400);
        return;
    }
    const usernameTaken = yield schema_1.Profile.exists({ username: req.body.username });
    if (usernameTaken) {
        res.send({ success: false, error: 'Username is taken.' });
        res.status(400);
        return;
    }
    const salt = crypto_1.default.randomBytes(12).toString('hex');
    const token = yield token_1.generateRandomUniqueToken();
    const profile = new schema_1.Profile({
        username: req.body.username,
        pin: hash(req.body.pin + salt),
        salt,
        token,
        last_active: new Date(),
        email: req.body.email,
        created: new Date()
    });
    yield profile.save();
    res.send({ success: true, profile: sanitizeModel(profile) });
}));
exports.routes.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.username) {
        res.send({ success: false, error: 'Invalid username.', profile: null });
        res.status(400);
        return;
    }
    const profile = yield schema_1.Profile.findOne({ username: req.body.username });
    if (!profile) {
        res.send({ success: false, error: 'User not found.', profile: null });
        res.status(400);
        return;
    }
    // see if the given password + the salt hash together to form the stored
    // password.
    const fullPassword = hash(req.body.password + profile.salt);
    if (fullPassword !== profile.pin) {
        // incorrect password.
        res.send({ success: false, error: 'Incorrect password.', profile: null });
        res.status(400);
        return;
    }
    // login the user.
    profile.token = yield token_1.generateRandomUniqueToken();
    yield profile.save();
    const data = { success: true, profile: sanitizeModel(profile) };
    res.send(data);
}));
//# sourceMappingURL=profile.js.map