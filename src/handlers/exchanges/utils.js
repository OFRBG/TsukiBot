// @flow
const _ = require('lodash');

const joiner = '\n`  ⇒` ';

const percentChange = (
  price /* : number */,
  base /* : number */
) /* : number */ => Math.round((price / base - 1) * 100);

const percentChangeMessage = (
  price /* : number */,
  base /* : string */
) /* : string */ =>
  !_.isNaN(parseFloat(base))
    ? `\n Change: \`${percentChange(price, parseFloat(base))}%\``
    : '';

const currencyPair = (
  coin1 /* : string */,
  coin2 /* : string */
) /* : string */ =>
  _.chain([coin1, coin2])
    .map(_.toUpper)
    .join('-')
    .value();

const calculateUsdtPrice = (
  coinPrice /* : string */,
  btcPrice /* : string */
) /* : string */ =>
  (
    Math.floor(
      parseFloat(coinPrice.substring(1, 10).split(' ')[0]) *
        parseFloat(btcPrice.substring(1, 8).split(' ')[0]) *
        100000000
    ) / 100000000
  ).toString();

/**
 * Format as monospace with bullet
 */
const coinLead = (coin /* : string */) /* : string */ => `\`• ${coin}\``;

/**
 * Format price data into a string
 */
const priceMsg /* : (data: Object) => string */ = data =>
  `\`${data.price} ${data.base} (${data.percentChange}%)\``;

/**
 * Take coin information and format as a string
 */
const buildMessage = (data /* : Object */, coin /* : string */) =>
  coinLead(coin) +
  _.chain(data)
    .map(priceMsg)
    .thru(messages => ['', ...messages])
    .join(joiner)
    .value();

module.exports = {
  buildMessage,
  currencyPair,
  calculateUsdtPrice,
  percentChangeMessage
};
