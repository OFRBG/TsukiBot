const cc = require('cryptocompare');

const getPriceCC = (coins, chn, action = '-', ext = 'd') => {
  const query = coins.concat(['BTC']);

  cc.priceFull(query.map((c) => c.toUpperCase()), ['USD', 'BTC'])
    .then((prices) => {
      const messageHeader = '__CryptoCompare/CMC__ Price for:\n';
      const ordered = {};

      const messages = coins.map((coin) => {
        const price = prices[coin];

        const bitcoinPrice = `${price.BTC.PRICE.toFixed(8)} BTC\` (\`${Math.round(price.BTC.CHANGEPCT24HOUR * 100) / 100}%\`)`;
        const dollarPrice = `${price.USD.PRICE} USD\` (\`${Math.round((price.BTC.CHANGEPCT24HOUR + prices.BTC.USD.CHANGEPCT24HOUR) * 100) / 100}%\`)`;

        const ticker = (coin.length > 6) ? coin.substring(0, 6) : coin;
        const prefix = (`\`• ${ticker}${' '.repeat(6 - ticker.length)} ⇒`);

        switch (action) {
          case '-':
            return `${prefix}\` \`${ext === 's' ? bitcoinPrice : dollarPrice}\n`;

          case '%':
            try {
              ordered[price.BTC.CHANGEPCT24HOUR + prices.BTC.USD.CHANGEPCT24HOUR] = `${prefix}\` \`${ext === 's' ? bitcoinPrice : dollarPrice}`;
              return '';
            } catch (e) {
              console.log('err');
              return '';
            }

          case '+':
            return `${prefix}\` \`${dollarPrice} \`⇒\` \`${bitcoinPrice}\n`;

          case '*':
            return `${prefix}💵\` \`${dollarPrice}\n\`|        ⇒\` \`${bitcoinPrice}\n`;

          default:
            return `${prefix}\` \`${ext === 's' ? bitcoinPrice : dollarPrice}\n`;
        }
      });

      const messageBody = action === '%'
        ? Object
          .keys(ordered)
          .sort((a, b) => parseFloat(b) - parseFloat(a))
          .map((key, orderedKeys) => ordered[orderedKeys[key]])
          .join()
        : messages.join();

      return messageHeader + messageBody;
    });
};

module.exports = { getPriceCC };
