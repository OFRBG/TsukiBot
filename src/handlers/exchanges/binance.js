// @flow
const _ = require('lodash');
// const binance = require('node-binance-api');
const request = require('request-promise-native');
const { calculateUsdtPrice } = require('./utils');

const userAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
const contentType = 'application/x-www-form-urlencoded';
const padSpaces = spaces => ' '.repeat(spaces);
const joiner = '\n`  ⇒` ';
const pairMatcher = /(.*)(USDT|BUSD|BTC|ETH|NGN|USDC|PAX|USDS|TUSD|BNB)/;

const url = 'https://api.binance.com/api/v1/ticker/24hr';

const pricesRequest = () => {
  const opt = {
    url,
    method: 'GET',
    agent: false,
    headers: {
      'User-Agent': userAgent,
      'Content-type': contentType
    }
  };

  return request(opt);
};

const extractTickers = symbol => {
  const result = pairMatcher.exec(symbol);
  return result ? [result[1], result[2]] : [];
};

const coinLead = coin => `\`• ${coin}\``;

const priceMsg = data =>
  `\`${data.price} ${data.base} (${data.percentChange}%)\``;

const buildMessage = (data, coin) =>
  coinLead(coin) +
  _.chain(data)
    .map(priceMsg)
    .thru(messages => ['', ...messages])
    .join(joiner)
    .value();

const reducePrices = (bitcoinPrice, bitcoinPercentChange) => (
  calculatedPrices,
  prices /*: SymbolInfo */
) => {
  const [coin, base, price, percentChange] = prices;

  const data = {
    ...(calculatedPrices[coin] || {}),
    [base]: { coin, base, price, percentChange }
  };

  if (base === 'BTC') {
    data.USDT = {
      coin,
      base: 'USDT',
      price: calculateUsdtPrice(price.toString(), bitcoinPrice),
      percentChange: (-(percentChange - bitcoinPercentChange)).toFixed(2)
    };
  }

  return _.set(calculatedPrices, coin, data);
};

const handler /*: Handler */ = async coins => {
  const allCoins /* string[] */ = _.chain(coins)
    .map(_.toUpper)
    .sort()
    .value();

  const markets = JSON.parse(await pricesRequest());

  const messageHeader = '__Binance__ Price for: \n';

  const btcData = markets.find(market => market.symbol === 'BTCUSDT');

  const requests /*: SymbolInfo[] */ = markets.map(market => {
    const rawPrice = parseFloat(market.lastPrice);

    const [coin, base] = extractTickers(market.symbol);

    if (!allCoins.includes(coin)) return '';

    const price = rawPrice.toFixed(rawPrice > 2 ? 2 : 8);

    const percentChange = parseFloat(market.priceChangePercent).toFixed(2);

    return [coin, base, price, percentChange];
  });

  const groupedRequests = _.chain(requests)
    .compact()
    .reduce(
      reducePrices(btcData.lastPrice, parseFloat(btcData.priceChangePercent)),
      {}
    )
    .map(buildMessage)
    .join('\n')
    .value();

  return messageHeader + groupedRequests;
};

const matcher /*: Matcher */ = command => ['bin', 'm', 'n'].includes(command);

const commandHandler /*: CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
