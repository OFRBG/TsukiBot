// @flow
const _ = require('lodash');
const request = require('request-promise-native');
const { calculateUsdtPrice } = require('./utils');

const userAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
const contentType = 'application/x-www-form-urlencoded';
const joiner = '\n`  ⇒` ';
const pairMatcher = /(.*)(USDT|BUSD|BTC|ETH|NGN|USDC|PAX|USDS|TUSD|BNB)/;

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
 * Format as monospace with bullet
 */
const coinLead = (coin /* : string */) /* : string */ => `\`• ${coin}\``;

/**
 * Format price data into a string
 */
const priceMsg /* : (data: Object) => string */ = data =>
  `\`${data.price} ${data.base} (${data.percentChange}%)\``;

/**
 * Take coin information and format as a string
 */
const buildMessage = (data /* : Object */, coin /* : string */) =>
  coinLead(coin) +
  _.chain(data)
    .map(priceMsg)
    .thru(messages => ['', ...messages])
    .join(joiner)
    .value();

/**
 * Combine prices of the same currency
 */
const reducePrices = (bitcoinPrice /* : string */, bitcoinPercentChange) => (
  calculatedPrices /* : {[coin: string] : BinanceCoinData}  */,
  prices /* : SymbolInfo */
) => {
  const [coin, base, price, percentChange] = prices;

  const currentData = calculatedPrices[coin];
  const newData /* : BinanceCoinData */ = {
    [base]: {
      coin,
      base,
      price,
      percentChange
    }
  };

  const data = _.assignIn({}, currentData, newData);

  if (base === 'BTC') {
    const usdtData /* : BinanceCoinData */ = {
      USDT: {
        coin,
        base: 'USDT',
        price: calculateUsdtPrice(price.toString(), bitcoinPrice),
        percentChange: (-(
          parseFloat(percentChange) - bitcoinPercentChange
        )).toFixed(2)
      }
    };

    _.assignIn(data, usdtData);
  }

  return _.assignIn(calculatedPrices[coin], data);
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
