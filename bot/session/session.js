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

import collection from '../models/sessions.js';

const getKey = ({ from, chat }) => {
    if (from == null || chat == null) {
        return null;
    }
    return `${from.id}:${chat.id}`;
};

export default () => {
    const saveSession = (key, data) => collection.updateOne({ key }, { $set: { data } }, { upsert: true });
    const getSession = (key) => __awaiter(void 0, void 0, void 0, function* () { var _a, _b; return (_b = (_a = (yield collection.findOne({ key }))) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {}; });
    return (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
        const key = getKey(ctx);
        const data = key == null ? undefined : yield getSession(key);
        ctx.session = data;
        yield next();
        if (ctx.session != null) {
            yield saveSession(key, ctx.session);
        }
    });
};
