bittrex.options({
  stream: false,
  verbose: false,
  cleartext: true,
});

const getPriceBittrex = (coin1, coin2, chn) => {
  coin1 = coin1.map((c) => c.toUpperCase()).sort();
  coin1.push('BTC');

  bittrex.sendCustomRequest('https://bittrex.com/Api/v2.0/pub/Markets/GetMarketSummaries', (res) => {
    const data = JSON.parse(res);

    if (data && data.result) {
      const p = data.result;
      let s = '__Bittrex__ Price for: \n';
      const sn = [];
      const vp = {};

      const markets = p.filter((item) => coin1.indexOf(item.Market.MarketCurrency) > -1);

      for (const market of markets) {
        const c = market;
        let pd = c.Summary.Last;
        pd = (c.Market.BaseCurrency === 'BTC') ? (pd.toFixed(8)) : pd;

        if (!sn[c.Market.MarketCurrency]) {
          sn[c.Market.MarketCurrency] = [];
        }

        const pch = (((pd / c.Summary.PrevDay) - 1) * 100).toFixed(2);
        sn[c.Market.MarketCurrency].push(`\`${pd} ${c.Market.BaseCurrency} (${pch}%)\` ∭ \`(V.${Math.trunc(c.Summary.BaseVolume)})\``);
      }

      for (const coin in sn) {
        s += (`\`• ${coin}${' '.repeat(6 - coin.length)}⇒\` ${sn[coin].join('\n`-       ⇒` ')
        }${coin !== 'BTC' && coin !== 'ETH' && sn[coin][2] == null ? `\n\`-       ⇒\` \`${
          Math.floor((sn[coin][0].substring(1, 10).split(' ')[0]) * (sn.BTC[0].substring(1, 8).split(' ')[0]) * 100000000) / 100000000} USDT\`` : ''
        }\n`);
      }

      s += (Math.random() > 0.8) ? `\n\`${quote} ${donationAdd}\`` : '';
      chn.send(s);
    } else {
      chn.send('Bittrex API error.');
    }
  });
};
