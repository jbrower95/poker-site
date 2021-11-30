"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = require("./v1/routes");
const routes = express_1.default.Router();
exports.routes = routes;
/*
 * All API versions.
 *  When we want to introduce a new API, we can add another subdomain here.
 */
routes.use('/v1', routes_1.routes);
//# sourceMappingURL=routes.js.map