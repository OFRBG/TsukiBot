const { Client } = require('coinbase');
const { currencyPair } = require('./utils');

const clientGDAX = new Client({
  apiKey: keys.coinbase[0],
  apiSecret: keys.coinbase[1]
});

const getPriceGDAX = (coin1, coin2, base) => {
  const pair = currencyPair(coin1, coin2);

  clientGDAX.getSpotPrice({ pair }, (err, price) => {
    if (err) {
      return 'API Error.';
    }

    const per =
      base !== -1
        ? `\n Change: \`${Math.round(
            (price.data.amount / base - 1) * 100 * 100
          ) / 100}%\``
        : '';

    return `__GDAX__ Price for **${currencyPair}** is : \`${
      price.data.amount
    } ${coin2.toUpperCase()}\`.${per}`;
  });
};

module.exports = { getPriceGDAX };
