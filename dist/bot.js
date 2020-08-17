"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./startup");
const env = require("env-var");
const discord_js_1 = require("discord.js");
const events_1 = require("./events");
const client = new discord_js_1.Client();
const token = env
    .get("BOT_TOKEN")
    .required()
    .asString();
client.on("ready", events_1.default.ready.bind(client));
client.on("message", events_1.default.message.bind(client));
client.login(token);
//# sourceMappingURL=bot.js.map