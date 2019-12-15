// @flow
const fs = require('fs');
const _ = require('lodash');
const handlers = require('./handlers/exchanges');

const pairs = JSON.parse(fs.readFileSync('./common/coins.json', 'utf8'));
const availablePrefixes = ['-t', '.tb'];

/**
 * Check if a value is a non empty string
 *
 * @param s Value to check
 */
const isNonEmptyString = (s /* : any */) => _.isString(s) && s.length > 0;

/**
 * Check if the lead parameter contains the prefix
 *
 * @param lead Lead parameter of the message
 * @param prefix Prefix to check
 */
const containsPrefix = (lead /* : string */, prefix /* : string */) =>
  lead.indexOf(prefix) === 0;

/**
 * Check if the lead parameter contains the prefix
 *
 * @param value Check if the value is a valid parameter
 */
const isValidParam = (value /* : string */) =>
  pairs.includes(value.toUpperCase()) || _.isNumber(parseFloat(value));

/**
 * Find the command handler for the given comment
 *
 * @param command Commend to match
 */
const getHandler = (command /* : string */) =>
  _.chain(handlers)
    .find(commandHandler => commandHandler.matcher(command))
    .get('handler')
    .value();

/**
 * Parse a raw message into handler parameters
 *
 * @param content Raw message to parse
 */
const getParams = (content /* : string */) => {
  const tokens = content.split(' ').filter(isNonEmptyString);

  if (_.isEmpty(tokens)) throw Error('No content');

  const matchedPrefix = availablePrefixes.find(prefix =>
    containsPrefix(tokens[0], prefix)
  );

  if (matchedPrefix == null) throw Error('No prefix');

  tokens[0] = tokens[0].replace(matchedPrefix, '');

  return _.compact(tokens);
};

module.exports = {
  getHandler,
  getParams,
  isValidParam
};
