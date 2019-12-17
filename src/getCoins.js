const request = require('request');
const fs = require('fs');

const include = ['USD', 'EUR', 'GBP', 'SGD', 'XBT', 'XLM', 'MXN', 'BCC', 'STR'];
const exclude = [
  'POST',
  'U',
  'AND',
  'IN',
  'POLL',
  'AM',
  'GOT',
  'GOOD',
  'TODAY'
];

const formatData = data => `["${data.slice().join('","')}"]`;

const update = () =>
  new Promise(resolve => {
    const url = 'http://www.cryptocompare.com/api/data/coinlist/';

    request({ url, json: true }, (err, res, body) => {
      const coins = Object.keys(body.Data).concat(include);

      const included = formatData(coins);

      exclude.forEach(f => coins.splice(coins.indexOf(f), 1));

      const excluded = formatData(coins);

      fs.writeFile('./common/coins.json', included, console.error);
      fs.writeFile('./common/coins_filtered.json', excluded, console.error);

      resolve([coins, excluded]);
    });
  });

module.exports = { update };
