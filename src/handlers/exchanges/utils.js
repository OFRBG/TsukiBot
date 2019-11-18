// @flow
const _ = require('lodash');

const percentChange = (price /*: number */, base /*: number */) /*: number */ =>
  Math.round((price / base - 1) * 100);

const percentChangeMessage = (
  price /*: number */,
  base /*: string */
) /*: string */ =>
  !_.isNaN(parseFloat(base))
    ? `\n Change: \`${percentChange(price, parseFloat(base))}%\``
    : '';

const currencyPair = (coin1 /*: string */, coin2 /*: string */) /*: string */ =>
  _.chain([coin1, coin2])
    .map(_.toUpper)
    .join('-')
    .value();

const calculateUsdtPrice = (
  coinPrice /*: string */,
  btcPrice /*: string */
) /*: string */ =>
  (
    Math.floor(
      parseFloat(coinPrice.substring(1, 10).split(' ')[0]) *
        parseFloat(btcPrice.substring(1, 8).split(' ')[0]) *
        100000000
    ) / 100000000
  ).toString();

module.exports = { currencyPair, calculateUsdtPrice, percentChangeMessage };
