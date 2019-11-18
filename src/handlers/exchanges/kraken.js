// @flow
const _ = require('lodash');
const KrakenClient = require('kraken-api');
const { promisify } = require('util');
const { currencyPair, percentChangeMessage } = require('./utils');

const client = new KrakenClient();

const api = promisify(client.api.bind(client));

/*::
type Handler = (coins: string[]) => Promise<string>
*/

const handler /*: Handler */ = async coins => {
  const [coin1 = 'ETH', coin2 = 'USD', base] = coins;

  const pair = currencyPair(coin1, coin2);

  const data = await api('Ticker', {
    pair: `${coin1.toUpperCase()}${coin2.toUpperCase()}`
  });

  const pairKey = _.keys(data.result)[0];
  const rawPrice = _.chain(data)
    .get(`result[${pairKey}].c[0]`)
    .toNumber()
    .value();

  const price = coin2.toUpperCase() === 'XBT' ? rawPrice.toFixed(8) : rawPrice;

  const percentChange = percentChangeMessage(price, base);

  return `__Kraken__ Price for **${pair}** is : \`${price} ${coin2.toUpperCase()}\`.${percentChange}`;
};

/*::
type Matcher = (command: string) => boolean
*/

const matcher /*: Matcher */ = command => ['k', 'kraken'].includes(command);

/*::
type CommandHandler = {
  handler: Handler,
  matcher: Matcher,
}
*/

const commandHandler /*: CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
