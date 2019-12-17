// @flow
const _ = require('lodash');
const bittrex = require('node.bittrex.api');
const { buildMessage } = require('./utils'); // TODO: Add calculated USDT prices

bittrex.options({
  stream: false,
  verbose: false,
  cleartext: true
});

const apiUrl = 'https://bittrex.com/Api/v2.0/pub/Markets/GetMarketSummaries';
const marketReducer = (currencyData, market) => {
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
};

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

  const groupedRequests = _.chain(data.result)
    .filter(item => currencies.includes(item.Market.MarketCurrency))
    .reduce(marketReducer, {})
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
