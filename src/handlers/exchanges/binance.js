// @flow
const _ = require('lodash');
const request = require('request-promise-native');
const { buildMessage, calculateUsdtPrice } = require('./utils');

const userAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
const contentType = 'application/x-www-form-urlencoded';
const pairMatcher = /(.*)(USDT|BTC|ETH)/;

const url = 'https://api.binance.com/api/v1/ticker/24hr';

/**
 * Query the Binance API
 */
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

/**
 * Extract the tickers from the given pair string
 */
const extractTickers = (symbol /* : string */) /* : [string, string] */ => {
  const result = pairMatcher.exec(symbol);
  return result ? [result[1], result[2]] : ['', ''];
};

/**
 * Combine prices of the same currency
 */
const reducePrices = (bitcoinPrice /* : string */, bitcoinPercentChange) => (
  calculatedPrices /* : {[coin: string] : BinanceCoinData}  */,
  prices /* : SymbolInfo */
) => {
  const [coin, base, price, percentChange] = prices;

  const newData = {
    coin,
    base,
    price,
    percentChange
  };

  if (base === 'BTC') {
    const usdtData = {
      coin,
      base: 'USDT',
      price: calculateUsdtPrice(price.toString(), bitcoinPrice),
      percentChange: (-(
        parseFloat(percentChange) - bitcoinPercentChange
      )).toFixed(2)
    };

    _.set(calculatedPrices, `${coin}.USDT`, usdtData);
  }

  return _.set(calculatedPrices, `${coin}.${base}`, newData);
};

const extractCoinData = requestedCoins => market => {
  const rawPrice = parseFloat(market.lastPrice);

  const [coin, base] = extractTickers(market.symbol);

  if (!requestedCoins.includes(coin)) return '';

  const price = rawPrice.toFixed(rawPrice > 2 ? 2 : 8).toString();
  const percentChange = parseFloat(market.priceChangePercent)
    .toFixed(2)
    .toString();

  return [coin, base, price, percentChange];
};

const handler /* : Handler */ = async coins => {
  const requestedCoins /* string[] */ = _.chain(coins)
    .map(_.toUpper)
    .concat(['BTC', 'ETH'])
    .uniq()
    .sort()
    .value();

  const messageHeader = '__Binance__ Price for: \n';

  const markets = JSON.parse(await pricesRequest());

  const btcData = markets.find(market => market.symbol === 'BTCUSDT');

  const otherCoinData /* : SymbolInfo[] */ = markets.map(
    extractCoinData(requestedCoins)
  );

  const calculatePrices = reducePrices(
    btcData.lastPrice,
    parseFloat(btcData.priceChangePercent)
  );

  const groupedRequests = _.chain(otherCoinData)
    .compact()
    .reduce(calculatePrices, {})
    .map(buildMessage)
    .join('\n')
    .value();

  return messageHeader + groupedRequests;
};

const matcher /* : Matcher */ = command => ['bin', 'm', 'n'].includes(command);

const commandHandler /* : CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
