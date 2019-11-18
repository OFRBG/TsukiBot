// @flow
const _ = require('lodash');
// const binance = require('node-binance-api');
const request = require('request-promise-native');
const { calculateUsdtPrice } = require('./utils');

const userAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
const contentType = 'application/x-www-form-urlencoded';
const padSpaces = spaces => ' '.repeat(spaces);
const joiner = '\n`- ⇒` ';
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

const calculateMessage = (coinData, coin, allCoinsData) => {
  const price =
    coin !== 'BTC' && coin !== 'ETH' && _.isNil(coinData[4])
      ? calculateUsdtPrice(coinData[0], allCoinsData.BTC[0])
      : '';

  // eslint-disable-next-line prefer-template
  return `\`• ${coin}${padSpaces(6 - coin.length)}⇒ \`${coinData.join(
    joiner
  )}${price}`;
};

const handler /*: Handler */ = async coins => {
  const allCoins /* string[] */ = _.chain(coins)
    .map(_.toUpper)
    .sort()
    .value();

  const markets = JSON.parse(await pricesRequest());

  const messageHeader = '__Binance__ Price for: \n';

  const requests = markets.map(market => {
    const rawPrice = parseFloat(market.lastPrice);

    const result = pairMatcher.exec(market.symbol);

    if (result == null) return '';

    const [, curr, base] = result;

    if (!allCoins.includes(curr)) return '';
    console.log(market.symbol);

    const price = base === 'BTC' ? rawPrice.toFixed(8) : rawPrice;

    const percentChange = parseFloat(market.priceChangePercent).toFixed(2);

    return `\`${price} ${base} (${percentChange}%)\` ∭ \`(V.${Math.trunc(
      parseFloat(market.quoteVolume)
    )})\``;
  });

  return messageHeader + _.compact(requests).join(joiner);
};

const matcher /*: Matcher */ = command => ['bin', 'm', 'n'].includes(command);

const commandHandler /*: CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
