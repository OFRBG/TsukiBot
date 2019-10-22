function getCoinArray(id, chn, coins = '', action = '') {
  const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;

  if (action === '') {
    coins = `{${coins}}`;
  }

  const conn = new pg.Client(conString);
  conn.connect();

  let query;

  // .tbpa call
  if (coins === '') {
    query = conn.query(
      'SELECT * FROM profiles where id = $1;',
      [id],
      (err, res) => {
        if (err) {
          console.log(err);
        } else if (res.rows[0]) {
          const coins = res.rows[0].coins.filter(
            value => !isNaN(value) || pairs.indexOf(value.toUpperCase()) > -1
          );

          getPriceCC(coins, chn, action);
        } else {
          chn.send('Set your array with `.tb pa [array]`.');
        }

        conn.end();
      }
    );

    // .tb pa call
  } else if (action == '') {
    query = conn.query(
      'INSERT INTO profiles(id, coins) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET coins = $2;',
      [id, coins],
      (err, res) => {
        if (err) {
          console.log(err);
        } else {
          chn.send(`Personal array set: \`${coins}\` for <@${id}>.`);
        }

        conn.end();
      }
    );
  } else {
    const command = action == '-' ? 'EXCEPT' : 'UNION';
    const sqlq = `UPDATE profiles SET coins = array(SELECT UNNEST(coins) FROM profiles WHERE id = $1 ${command} SELECT UNNEST(ARRAY[$2])) WHERE id = $1;`;
    const queryp = pgp.as.format(sqlq, [id, coins]);

    query = conn.query(queryp, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        chn.send('Personal array modified.');
      }

      conn.end();
    });
  }
}
