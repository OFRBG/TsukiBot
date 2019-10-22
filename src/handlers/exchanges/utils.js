const _ = require('lodash');

const currencyPair = (coin1, coin2) => _.chain([coin1, coin2]).map(_.toUpper).join('-').value();

const calculateUsdtPrice = (coinPrice, btcPrice) => Math.floor(
  (coinPrice.substring(1, 10).split(' ')[0]) * (btcPrice.substring(1, 8).split(' ')[0]) * 100000000,
) / 100000000;


module.exports = { currencyPair, calculateUsdtPrice };
