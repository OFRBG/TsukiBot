// @flow
/* eslint-disable */
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
/* eslint-enable */

require('dotenv-flow').config();

global.fetch = require('node-fetch');

const _ = require('lodash');
const { argv } = require('yargs');
const env = require('env-var');
const Discord = require('discord.js');

const logger = require('./logger');
const { getHandler, getParams, isValidParam } = require('./utils');

const client = new Discord.Client();
const token = env
  .get('BOT_TOKEN')
  .required()
  .asString();

/**
 * Match a message against possible commands
 *
 * @param message Discord message
 */
const commands = message => {
  const tokens = getParams(message.content);

  if (_.isEmpty(tokens)) throw Error('No parameters');

  logger.verbose(`Tokenized command: [${tokens.join(', ')}]`);

  const [command, ...options] = tokens;

  const params = options.filter(isValidParam).slice(0, 10);

  const handler = getHandler(command);

  if (_.isNil(handler)) throw Error('No command matched');

  logger.verbose(`Matched ${command}`);

  return handler(params);
};

/**
 * Handle server ready state
 */
const readyHandler = async () => {
  logger.info('Server ready');

  if (argv.d) {
    const devId = env
      .get('DEV_ID')
      .required()
      .asString();

    logger.info(`Dev mode. Listening to ${devId}`);

    try {
      const dev = await client.fetchUser(devId);
      await dev.send('TsukiBot loaded');
    } catch (err) {
      logger.error(err);
    }
  }

  await client.user.setActivity('.tbhelp');
  logger.debug('Activity set');
};

/**
 * Handle incoming messages
 *
 * @param message Discord message
 */
const messageHandler = async message => {
  if (argv.d && message.author.id !== env.get('DEV_ID').asString()) return;

  if (_.isNil(message.author)) return;

  try {
    const response = await commands(message);

    message.channel.send(response);
  } catch (err) {
    logger.debug(err.message);
  }
};

client.on('ready', readyHandler);
client.on('message', messageHandler);

client.login(token);
