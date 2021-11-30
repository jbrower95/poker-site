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
const schema_1 = require("./schema");
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
function generateRandomUniqueToken() {
    return __awaiter(this, void 0, void 0, function* () {
        // ten attempts.
        for (let i = 0; i < 10; i++) {
            const token = crypto_random_string_1.default({ length: 20, type: 'base64' });
            // see if this exists.
            const inUse = yield schema_1.Profile.exists({
                token
            });
            // TODO(correctness)- This is a low-danger race condition.
            if (!inUse) {
                return token;
            }
        }
        throw new Error('Failed to generate session token.');
    });
}
exports.generateRandomUniqueToken = generateRandomUniqueToken;
//# sourceMappingURL=token.js.map