const BFX = require('bitfinex-api-node');
const { currencyPair } = require('./utils');

const bfxRest = new BFX().rest;

const getPriceBitfinex = (coin1, coin2) => {
  const pair = currencyPair(coin1, coin2);

  coin2 = coin2 || (coin1.toUpperCase() === 'BTC' ? 'USD' : 'BTC');

  bfxRest.ticker(`${coin1}${coin2}`.toUpperCase(), (err, res) => {
    if (err) {
      return 'API Error';
    }

    return `__Bitfinex__ Price for **${pair}** is : \`${parseFloat(
      res.last_price
    ).toFixed(8)} ${coin2.toUpperCase()}\`.`;
  });
};

module.exports = { getPriceBitfinex };
