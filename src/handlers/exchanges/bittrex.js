// @flow
const _ = require('lodash');
const bittrex = require('node.bittrex.api');
// const { calculateUsdtPrice } = require('./utils'); // TODO: Add calculated USDT prices

bittrex.options({
  stream: false,
  verbose: false,
  cleartext: true
});

const apiUrl = 'https://bittrex.com/Api/v2.0/pub/Markets/GetMarketSummaries';
const joiner = '\n`  ⇒` ';

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

const handler /* : Handler */ = async coins => {
  const currencies = _.chain(coins)
    .map(_.toUpper)
    .concat(['BTC'])
    .sort()
    .value();

  const messageHeader = '__Bittrex__ Price for: \n';

  const data = await new Promise(resolve =>
    bittrex.sendCustomRequest(apiUrl, result => resolve(JSON.parse(result)))
  );

  if (!_.has(data, 'result')) throw Error('No data received');

  const allMarkets = data.result;

  const markets = allMarkets.filter(item =>
    currencies.includes(item.Market.MarketCurrency)
  );

  const result = markets.reduce((currencyData, market) => {
    const summary = market.Summary;

    const rawLastPrice = summary.Last;
    const base = market.Market.BaseCurrency;
    const coin = market.Market.MarketCurrency;

    const price = rawLastPrice.toFixed(rawLastPrice > 1 ? 2 : 8);
    const percentChange = ((price / summary.PrevDay - 1) * 100).toFixed(2);

    const newData = {
      base,
      price,
      percentChange,
      volume: summary.BaseVolume
    };

    return _.set(currencyData, `${coin}.${base}`, newData);
  }, {});

  const groupedRequests = _.chain(result)
    .map(buildMessage)
    .join('\n')
    .value();

  return messageHeader + groupedRequests;
};

const matcher /* : Matcher */ = command => ['bit', 'x'].includes(command);

const commandHandler /* : CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
