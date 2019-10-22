const _ = require('lodash');
const binance = require('node-binance-api');
const { calculateUsdtPrice } = require('./utils');

const getPriceBinance = (coins) => {
  const allCoins = coins.map(_.toUpper).sort().push('BTC');

  binance.prevDay(false, (res) => {
    if (res) {
      const markets = res;
      const messageHeader = '__Binance__ Price for: \n';

      const sn = markets.reduce((data, market) => {
        const rawPrice = parseFloat(market.lastPrice);

        const curr = (market.symbol.slice(-4) === 'USDT')
          ? market.symbol.slice(0, -4)
          : market.symbol.slice(0, -3);

        if (!allCoins.includes(curr)) return;

        const base = (market.symbol.slice(-4) === 'USDT')
          ? market.symbol.slice(0, -4)
          : market.symbol.slice(0, -3);

        const price = (base === 'BTC')
          ? rawPrice.toFixed(8)
          : rawPrice;

        if (!sn[curr]) {
          sn[curr] = [];
        }

        const percentChange = parseFloat(market.priceChangePercent).toFixed(2);
        const message = `\`${price} ${base} (${percentChange}%)\` ∭ \`(V.${Math.trunc(parseFloat(market.quoteVolume))})\``;

        if (base === 'BTC') {
          data[curr].unshift(message);
        } else {
          data[curr].push(message);
        }
      });

      return messageHeader + _
        .chain(sn)
        .map((coinData, coin, allCoinsData) => (
          `\`• ${coin}${' '.repeat(6 - coin.length)}⇒\` ${coinData.join('\n`- ⇒` ')}${
            coin !== 'BTC' && coin !== 'ETH' && coinData[4] == null}`
            ? calculateUsdtPrice(coinData[0], allCoinsData.BTC[0])
            : ''));
    }
    return 'Binance API error';
  });
};

module.exports = { getPriceBinance };
