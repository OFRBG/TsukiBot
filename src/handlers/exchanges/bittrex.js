const _ = require('lodash');
const bittrex = require('node.bittrex.api');
const { calculateUsdtPrice } = require('./utils');

bittrex.options({
  stream: false,
  verbose: false,
  cleartext: true,
});

const getPriceBittrex = (baseCoins) => {
  const bases = _(baseCoins).map(_.toUpperCase).sort().value();
  bases.push('BTC');

  bittrex.sendCustomRequest('https://bittrex.com/Api/v2.0/pub/Markets/GetMarketSummaries', (res) => {
    const data = JSON.parse(res);

    if (data && data.result) {
      const p = data.result;
      const message = '__Bittrex__ Price for: \n';
      const sn = [];

      const markets = p.filter((item) => baseCoins.includes(item.Market.MarketCurrency));

      markets.map((market) => {
        const rawLastPrice = market.Summary.Last;
        const price = (market.Market.BaseCurrency === 'BTC')
          ? rawLastPrice.toFixed(8)
          : rawLastPrice;

        if (!sn[market.Market.MarketCurrency]) {
          sn[market.Market.MarketCurrency] = [];
        }

        const percentChange = (((price / market.Summary.PrevDay) - 1) * 100).toFixed(2);

        sn[market.Market.MarketCurrency].push(
          `\`${price} ${market.Market.BaseCurrency} (${percentChange}%)\` ∭ \`(V.${Math.trunc(market.Summary.BaseVolume)})\``,
        );

        return message + _
          .chain(sn)
          .map((coinData, coin, coins) => (
            `\`• ${coin}${' '.repeat(6 - coin.length)}⇒\` ${coinData.join('\n`- ⇒` ')}${
              coin !== 'BTC' && coin !== 'ETH' && coinData[2] == null}`
              ? calculateUsdtPrice(coinData[0], coins.BTC[0])
              : ''));
      });
    }
  });
};

module.exports = { getPriceBittrex };
