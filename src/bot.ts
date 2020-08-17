/* --------------------------------------------------------------------

                   _____          _    _ ____        _
                  |_   ____ _   _| | _(_| __ )  ___ | |_
                    | |/ __| | | | |/ | |  _ \ / _ \| __|
                    | |\__ | |_| |   <| | |_) | (_) | |_
                    |_||___/\__,_|_|\_|_|____/ \___/ \__|


 * ------------------------------------------------------------------- */

import { Client } from "discord.js";
import env from "env-var";
import { onMessage, onReady } from "Events";
import { logError } from "Utils";

const client = new Client();
const token = env
  .get("BOT_TOKEN")
  .required()
  .asString();

client.on("ready", onReady(client));
client.on("message", onMessage());

client.login(token).catch(logError);
