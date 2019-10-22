const getPriceCC = (coins, chn, action = '-', ext = 'd') => {
  const query = coins.concat(['BTC']);

  // Get the spot price of the pair and send it to general
  cc.priceFull(query.map((c) => c.toUpperCase()), ['USD', 'BTC'])
    .then((prices) => {
      let msg = '__CryptoCompare/CMC__ Price for:\n';
      const ordered = {};

      const bpchg = parseFloat(cmcArrayDict.BTC.percent_change_24h);

      for (let i = 0; i < coins.length; i++) {
        let bp; let
          up;

        try {
          bp = `${prices[coins[i].toUpperCase()].BTC.PRICE.toFixed(8)} BTC\` (\`${
            Math.round(prices[coins[i].toUpperCase()].BTC.CHANGEPCT24HOUR * 100) / 100}%\`)`;
          up = `${prices[coins[i].toUpperCase()].USD.PRICE} USD\` (\`${
            Math.round((prices[coins[i].toUpperCase()].BTC.CHANGEPCT24HOUR + prices.BTC.USD.CHANGEPCT24HOUR) * 100) / 100}%\`)`;
        } catch (e) {
          if (cmcArrayDict[coins[i].toUpperCase()]) {
            bp = `${parseFloat(cmcArrayDict[coins[i].toUpperCase()].price_btc).toFixed(8)} BTC\` (\`${
              Math.round(parseFloat(cmcArrayDict[coins[i].toUpperCase()].percent_change_24h - bpchg) * 100) / 100}%\`)`;
            up = `${parseFloat(cmcArrayDict[coins[i].toUpperCase()].price_usd)} USD\` (\`${
              Math.round(parseFloat(cmcArrayDict[coins[i].toUpperCase()].percent_change_24h) * 100) / 100}%\`)`;
          } else {
            bp = 'unvavilable`';
            up = 'unavailable`';
          }
        }

        coins[i] = (coins[i].length > 6) ? coins[i].substring(0, 6) : coins[i];
        switch (action) {
          case '-':
            msg += (`\`• ${coins[i].toUpperCase()}${' '.repeat(6 - coins[i].length)} ⇒\` \`${ext === 's' ? bp : up}\n`);
            break;

          case '%':
            try {
              ordered[prices[coins[i].toUpperCase()].BTC.CHANGEPCT24HOUR + prices.BTC.USD.CHANGEPCT24HOUR] = (`\`• ${coins[i].toUpperCase()}${' '.repeat(6 - coins[i].length)} ⇒\` \`${ext === 's' ? bp : up}\n`);
            } catch (e) {
              if (cmcArrayDict[coins[i].toUpperCase()]) ordered[cmcArrayDict[coins[i].toUpperCase()].percent_change_24h] = (`\`• ${coins[i].toUpperCase()}${' '.repeat(6 - coins[i].length)} ⇒\` \`${ext === 's' ? bp : up}\n`);
            }

            break;

          case '+':
            msg += (`\`• ${coins[i].toUpperCase()}${' '.repeat(6 - coins[i].length)} ⇒\` \`${
              up} \`⇒\` \`${
              bp}\n`);
            break;

          case '*':
            msg += (`\`• ${coins[i].toUpperCase()}${' '.repeat(6 - coins[i].length)} ⇒ 💵\` \`${
              up}\n\`|        ⇒\` \`${
              bp}\n`);
            break;

          default:
            msg += (`\`• ${coins[i].toUpperCase()}${' '.repeat(6 - coins[i].length)} ⇒\` \`${ext === 's' ? bp : up}\n`);
            break;
        }
      }

      if (action === '%') {
        const k = Object.keys(ordered).sort((a, b) => parseFloat(b) - parseFloat(a));
        for (const k0 in k) msg += ordered[k[k0]];
      }

      chn.send(msg);
    })
    .catch(console.log);
};

const getPricePolo = (coin1, coin2, chn) => {
  const url = 'https://poloniex.com/public?command=returnTicker';
  coin2 = coin2.toUpperCase();

  if (coin2 === 'BTC' || coin2 === 'ETH' || coin2 === 'USDT') {
    request({
      url,
      json: true,
    }, (error, response, body) => {
      const pair = `${coin2.toUpperCase()}_${coin1.toUpperCase()}`;

      try {
        const s = body[pair].last;

        let ans = ('__Poloniex__ Price for:\n');

        ans += (`\`• ${coin1.toUpperCase()}${' '.repeat(6 - coin1.length)}⇒ ${s} ${coin2.toUpperCase()} `
          + `(${(body[pair].percentChange * 100).toFixed(2)}%)\` ∭ \`(V.${Math.trunc(body[pair].baseVolume)})\`\n`
          + `\`-       ⇒\` \`${(body[`BTC_${coin1.toUpperCase()}`].last * body.USDT_BTC.last).toFixed(8)} USDT\``
          + '\n');

        ans += (Math.random() > 0.6) ? "\n`Tired of Bittrex's policies? Join Binance with my link:` <https://launchpad.binance.com/register.html?ref=10180938>" : '';
        chn.send(ans);
      } catch (err) {
        console.log(err);
        chn.send('Poloniex API Error.');
      }
    });
  }
};


const getPriceBinance = (coin1, coin2, chn) => {
  coin1 = coin1.map((c) => c.toUpperCase()).sort();
  coin1.push('BTC');

  binance.prevDay(false, (data) => {
    if (data) {
      const markets = data;
      let s = '__Binance__ Price for: \n';
      const sn = [];
      const vp = {};

      for (const idx in markets) {
        const c = markets[idx];
        let pd = parseFloat(c.lastPrice);

        const curr = (c.symbol.slice(-4) === 'USDT') ? c.symbol.slice(0, -4) : c.symbol.slice(0, -3);
        if (coin1.indexOf(curr) === -1) continue;

        const base = (c.symbol.slice(-4) === 'USDT') ? c.symbol.slice(-4) : c.symbol.slice(-3);

        pd = (base === 'BTC') ? (pd.toFixed(8)) : pd;

        if (!sn[curr]) {
          sn[curr] = [];
        }

        const pch = parseFloat(c.priceChangePercent).toFixed(2);
        if (base === 'BTC') sn[curr].unshift(`\`${pd} ${base} (${pch}%)\` ∭ \`(V.${Math.trunc(parseFloat(c.quoteVolume))})\``);
        else sn[curr].push(`\`${pd} ${base} (${pch}%)\` ∭ \`(V.${Math.trunc(parseFloat(c.quoteVolume))})\``);
      }

      for (const coin in sn) {
        s += (`\`• ${coin}${' '.repeat(6 - coin.length)}⇒\` ${sn[coin].join('\n`-       ⇒` ')
        }${coin !== 'BTC' && coin !== 'ETH' && coin !== 'BNB' && sn[coin][4] == null ? `\n\`-       ⇒\` \`${
          Math.floor((sn[coin][0].substring(1, 10).split(' ')[0]) * (sn.BTC[0].substring(1, 8).split(' ')[0]) * 100000000) / 100000000} USDT\`` : ''
        }\n`);
      }

      s += (Math.random() > 0.8) ? `\n\`${quote} ${donationAdd}\`` : '';
      chn.send(s);
    } else {
      chn.send('Binance API error.');
    }
  });
};
