const _ = require('lodash');
const bittrex = require('node.bittrex.api');
const { calculateUsdtPrice } = require('./utils');

bittrex.options({
  stream: false,
  verbose: false,
  cleartext: true
});

const apiUrl = 'https://bittrex.com/Api/v2.0/pub/Markets/GetMarketSummaries';

const getPriceBittrex = async baseCoins => {
  const bases = _(baseCoins)
    .map(_.toUpperCase)
    .concat('BTC')
    .sort()
    .value();

  const message = '__Bittrex__ Price for: \n';

  const data = await new Promise(resolve =>
    bittrex.sendCustomRequest(apiUrl, resolve)
  );

  if (!_.has(data, 'result')) throw Error('No data received');

  const allMarkets = data.result;

  const markets = allMarkets.filter(item =>
    baseCoins.includes(item.Market.MarketCurrency)
  );

  const result = markets.reduce((currencyData, market) => {
    const summary = market.Summary;

    const rawLastPrice = summary.Last;
    const base = market.Market.BaseCurrency;
    const coin = market.Market.MarketCurrency;

    const price = rawLastPrice.toFixed(base === 'BTC' ? 8 : 2);

    const percentChange = ((price / summary.PrevDay - 1) * 100).toFixed(2);

    return _.assignIn(currencyData[coin], {
      [base]: {
        price,
        percentChange,
        volume: summary.BaseVolume
      }
    });
  });

  /* _.chain(result).map((coinData, coin, coins) =>
    `\`• ${coin}${' '.repeat(6 - coin.length)}⇒\` ${coinData.join(
      '\n`- ⇒` '
    )}${coin !== 'BTC' && coin !== 'ETH' && coinData[2] == null}`
      ? calculateUsdtPrice(coinData[0], coins.BTC[0])
      : ''
  ); */
};

module.exports = { getPriceBittrex };
