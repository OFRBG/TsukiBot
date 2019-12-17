const _ = require('lodash');
const { argv } = require('yargs');
const env = require('env-var');

const { MatchingError } = require('./globals');
const logger = require('./logger');
const { getHandler, getParams, isValidParam } = require('./utils');

/**
 * Handle server ready state
 */
async function readyHandler() {
  logger.info('Server ready');

  if (argv.d) {
    const devId = env
      .get('DEV_ID')
      .required()
      .asString();

    logger.info(`Dev mode. Listening to ${devId}`);

    try {
      const dev = await this.fetchUser(devId);
      await dev.send('TsukiBot loaded');
    } catch (err) {
      logger.error(err);
    }
  }

  await this.user.setActivity('.tbhelp');
  logger.debug('Activity set');
}

/**
 * Match a message against possible commands
 *
 * @param message Discord message
 */
const commands = message => {
  const tokens = getParams(message.content);

  if (_.isEmpty(tokens)) throw new MatchingError('No parameters');

  logger.verbose(`Tokenized command: [${tokens.join(', ')}]`);

  const [command, ...options] = tokens;

  const handler = getHandler(command);

  if (_.isNil(handler)) throw new MatchingError('No command matched');

  const params = options.filter(isValidParam).slice(0, 10);

  logger.info(`Matched ${command}`);

  return handler(params);
};

/**
 * Handle incoming messages
 *
 * @param message Discord message
 */
async function messageHandler(message) {
  if (argv.d && message.author.id !== env.get('DEV_ID').asString()) return;

  if (_.isNil(message.author)) return;

  try {
    const response = await commands(message);
    message.channel.send(response);
  } catch (err) {
    switch (err.name) {
      case 'MatchingError':
        logger.debug(err.message);
        break;
      default:
        logger.error(err.message);
        break;
    }
  }
}

module.exports = {
  message: messageHandler,
  ready: readyHandler
};
