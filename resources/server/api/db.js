"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL);
exports.redis = redis;
const DB_URL = process.env.MONGODB_URI;
mongoose_1.default.connect(DB_URL);
const db = mongoose_1.default.connection;
exports.db = db;
//# sourceMappingURL=db.js.map