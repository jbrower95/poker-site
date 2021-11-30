"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./api/routes");
const router = express_1.default.Router();
exports.router = router;
function staticAsset(name) {
    return path_1.default.join(__dirname + '/../' + name);
}
router.get('/', (req, res) => {
    res.sendFile(staticAsset('index.html'));
});
/* This binds all of the resources for the react site. */
router.use('/resources', express_1.default.static(__dirname + '/..'));
/* Bind all of the API endpoints. */
router.use('/api', routes_1.routes);
//# sourceMappingURL=routes.js.map