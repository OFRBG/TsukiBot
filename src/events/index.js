const _ = require('lodash');
const { argv } = require('yargs');
const env = require('env-var');

const { processMessage, logError, checkDevMode } = require('./helpers');

const logger = require('../logger');

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
 * Handle incoming messages
 *
 * @param message Discord message
 */
async function messageHandler(message) {
  if (checkDevMode(message) || _.isNil(message.author)) return;

  try {
    const response = await processMessage(message);
    message.channel.send(response);
  } catch (error) {
    logError(error);
  }
}

module.exports = {
  message: messageHandler,
  ready: readyHandler
};
