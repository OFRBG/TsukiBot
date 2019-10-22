const KrakenClient = require('kraken-api');
const { currencyPair } = require('./utils');

const clientKraken = new KrakenClient();

const getPriceKraken = (coin1, coin2, base) => {
  const pair = currencyPair(coin1, coin2);

  clientKraken.api('Ticker', { pair: `${coin1.toUpperCase()}${coin2.toUpperCase()}` }, (error, data) => {
    if (error) {
      return '520ken API no response.';
    }

    const rawPrice = (data.result[Object.keys(data.result)].c[0]);
    const price = (coin2.toUpperCase() === 'XBT') ? rawPrice.toFixed(8) : rawPrice;

    const per = base !== -1
      ? `\n Change: \`${Math.round(((price / base - 1) * 100) * 100) / 100}%\``
      : '';

    return `__Kraken__ Price for **${pair}** is : \`${price} ${coin2.toUpperCase()}\`.${per}`;
  });
};

module.exports = { getPriceKraken };
