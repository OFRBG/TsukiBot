const cmcArrayDict = {};
const messageHeader = '__CoinMarketCap__ Price for:\n';

const buildMessage = (coins, { action, ext }) => {
  const bpchg = parseFloat(cmcArrayDict.BTC.percent_change_24h);

  return coins.reduce((msg, coin) => {
    const coinData = cmcArrayDict[coin];

    const bitcoinPrice = `${parseFloat(coinData.price_btc).toFixed(8)} BTC\` (\`${
      Math.round(parseFloat(coinData.percent_change_24h - bpchg) * 100) / 100}%\`)`;

    const dollarPrice = `${parseFloat(coinData.price_usd)} USD\` (\`${
      Math.round(parseFloat(coinData.percent_change_24h) * 100) / 100}%\`)`;

    const ticker = (coin.length > 6) ? coin.substring(0, 6) : coin;
    const prefix = `\`• ${ticker}${' '.repeat(6 - ticker.length)} ⇒`;

    switch (action) {
      case '-':
        return `${msg}${prefix}\` \`${ext === 's' ? bitcoinPrice : dollarPrice}\n`;

      case '+':
        return `${msg}${prefix}\` \`${dollarPrice} \`⇒\` \`${bitcoinPrice}\n`;

      case '*':
        return `${msg}${prefix}💵\` \`${dollarPrice}\n\`| ⇒\` \`${bitcoinPrice}\n`;

      default:
        return `${msg}${prefix}\` \`${ext === 's' ? bitcoinPrice : dollarPrice}\n`;
    }
  });
};

const getPriceCMC = (coins, action = '-', ext = 'd') => {
  const messageBody = buildMessage(coins, { action, ext });

  return messageHeader + messageBody;
};

module.exports = { getPriceCMC };
