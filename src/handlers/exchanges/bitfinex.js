// @flow
const BFX = require('bitfinex-api-node');
const { promisify } = require('util');
const { currencyPair } = require('./utils');

const client = new BFX().rest;

const api = promisify(client.ticker.bind(client));

const handler /*: Handler */ = async coins => {
  const [coin1 = 'ETH', coin2 = 'USD'] = coins;

  const pair = currencyPair(coin1, coin2);

  const res = await api(`${coin1}${coin2}`.toUpperCase());

  const price =
    coin2.toUpperCase() === 'USD'
      ? parseFloat(res.last_price).toFixed(2)
      : res.last_price;

  return `__Bitfinex__ Price for **${pair}** is : \`${price} ${coin2.toUpperCase()}\`.`;
};

const matcher /*: Matcher */ = command => ['fx', 'bitfinex'].includes(command);

const commandHandler /*: CommandHandler */ = {
  handler,
  matcher
};

module.exports = commandHandler;
