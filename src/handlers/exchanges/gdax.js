// @flow
const _ = require('lodash');
const { Client } = require('coinbase');
const env = require('env-var');
const { promisify } = require('util');
const { currencyPair, percentChangeMessage } = require('./utils');

const keys = env
  .get('COINBASE_KEYS')
  .required()
  .asArray();

const client = new Client({
  apiKey: keys[0],
  apiSecret: keys[1]
});

const api = promisify(client.getSpotPrice.bind(client));

/*::
type Handler = (coins: string[]) => Promise<string>
*/

const handler /*: Handler */ = async coins => {
  const [coin1 = 'ETH', coin2 = 'USD', base] = coins;

  const pair = currencyPair(coin1, coin2);

  const response = await api({ currencyPair: pair });

  const price = response.data.amount;

  const percentChange = !_.isNaN(parseFloat(base))
    ? percentChangeMessage(Math.round((price / parseFloat(base) - 1) * 100))
    : '';

  return `__GDAX__ Price for **${pair}** is : \`${price} ${coin2.toUpperCase()}\`.${percentChange}`;
};

/*::
type Matcher = (command: string) => boolean
*/

const matcher /*: Matcher */ = command => ['g', 'gdax'].includes(command);

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
