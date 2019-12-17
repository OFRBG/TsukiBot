/* --------------------------------------------------------------------

                   _____          _    _ ____        _
                  |_   ____ _   _| | _(_| __ )  ___ | |_
                    | |/ __| | | | |/ | |  _ \ / _ \| __|
                    | |\__ | |_| |   <| | |_) | (_) | |_
                    |_||___/\__,_|_|\_|_|____/ \___/ \__|



 * Author:      Oscar "Cehhiro" Fonseca
 * Program:     TsukiBot

 * Discord bot that offers a wide range of services
 * related to cryptocurrencies.

 * No parameters on start, except -d for dev mode.

 * If you like this service, consider donating
 * ETH to my address: 0xd234168c142D2771cD96eA8d59b1f57304604533 

 * ------------------------------------------------------------------- */

require('./startup');

const env = require('env-var');
const Discord = require('discord.js');

const handlers = require('./handlers');

const client = new Discord.Client();
const token = env
  .get('BOT_TOKEN')
  .required()
  .asString();

client.on('ready', handlers.ready.bind(client));
client.on('message', handlers.message.bind(client));

client.login(token);
