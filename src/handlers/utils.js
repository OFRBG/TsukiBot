const _ = require('lodash');

const currencyPair = (coin1, coin2) => _.chain([coin1, coin2]).map(_.toUpper).join('-').value();

module.exports = { currencyPair };
