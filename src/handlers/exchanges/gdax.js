// @flow
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

const handler /* : Handler */ = async coins => {
  const [coin1 = 'ETH', coin2 = 'USD', base] = coins;

  const pair = currencyPair(coin1, coin2);

  const response = await api({ currencyPair: pair });

  const price = response.data.amount;

  const percentChange = percentChangeMessage(price, base);

  return `__GDAX__ Price for **${pair}** is : \`${price} ${coin2.toUpperCase()}\`.${percentChange}`;
};

const matcher /* : Matcher */ = command => ['g', 'gdax'].includes(command);

const commandHandler /* : CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
