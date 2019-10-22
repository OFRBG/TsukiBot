const request = require('request');

const getPricePoloniex = (coin1, coin2) => {
  const url = 'https://poloniex.com/public?command=returnTicker';

  if (coin2 === 'BTC' || coin2 === 'ETH' || coin2 === 'USDT') {
    request({ url, json: true }, (error, response, body) => {
      const pair = `${coin2}_${coin1}`;

      try {
        const s = body[pair].last;

        const messageHeader = '__Poloniex__ Price for:\n';

        const messageBody =
          `\`• ${coin1}${' '.repeat(6 - coin1.length)}⇒ ${s} ${coin2} ` +
          `(${(body[pair].percentChange * 100).toFixed(
            2
          )}%)\` ∭ \`(V.${Math.trunc(body[pair].baseVolume)})\`\n` +
          `\`-       ⇒\` \`${(
            body[`BTC_${coin1}`].last * body.USDT_BTC.last
          ).toFixed(8)} USDT\`` +
          '\n';

        return messageHeader + messageBody;
      } catch (err) {
        console.log(err);
        return 'Poloniex API Error';
      }
    });
  }
};

module.exports = { getPricePoloniex };
