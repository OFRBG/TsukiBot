const _ = require('lodash');
const { argv } = require('yargs');
const env = require('env-var');

const { MatchingError } = require('../globals');
const logger = require('../logger');
const { getHandler, getParams, isValidParam } = require('../utils');

const checkDevMode = message =>
  argv.d && message.author.id !== env.get('DEV_ID').asString();

/**
 * Match a message against possible commands
 *
 * @param message Discord message
 */
const processMessage = message => {
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
 * Log errors according to their type
 *
 * @param error Error of extended error type
 */
const logError = (error /* : Error */) => {
  switch (error.name) {
    case 'MatchingError':
      logger.debug(error.message);
      break;
    default:
      logger.error(error.stack);
      break;
  }
};

module.exports = { processMessage, logError, checkDevMode };
