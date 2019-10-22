const request = require('request');
const fs = require('fs');

const update = () => new Promise(((resolve) => {
  const url = 'http://www.cryptocompare.com/api/data/coinlist/';
  const extras = ['USD', 'EUR', 'GBP', 'SGD', 'XBT', 'XLM', 'MXN', 'BCC', 'STR'];
  const filters = ['POST', 'U', 'AND', 'IN', 'POLL', 'AM', 'GOT', 'GOOD', 'TODAY'];

  request({ url, json: true }, (err, res, body) => {
    let coins = Object.keys(body.Data).concat(extras);
    let coinsf = Object.keys(body.Data).concat(extras);

    const coinsa = coins.slice();
    coins = coins.join('","');
    coins = `["${coins}"]`;

    filters.forEach((f) => coinsf.splice(coinsf.indexOf(f), 1));

    const coinsfa = coinsf.slice();
    coinsf = coinsf.join('","');
    coinsf = `["${coinsf}"]`;

    fs.writeFile('./common/coins.json', coins, console.error);
    fs.writeFile('./common/coins_filtered.json', coinsf, console.error);

    resolve([coinsa, coinsfa]);
  });
}));

module.exports = { update };
