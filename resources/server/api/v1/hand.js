"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
exports.routes = express_1.default.Router();
exports.routes.use(utils_1.authRequired); // all routes authenticated on this subdomain.
/**
 * List all of the events that have happened in this game so far.
 */
exports.routes.get('/events', (_req, _res) => {
    throw new Error('Unimplemented.');
});
//# sourceMappingURL=hand.js.map