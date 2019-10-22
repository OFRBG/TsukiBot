/* eslint-disable */
/* --------------------------------------------------------------------

                   _____          _    _ ____        _
                  |_   ____ _   _| | _(_| __ )  ___ | |_
                    | |/ __| | | | |/ | |  _ \ / _ \| __|
                    | |\__ | |_| |   <| | |_) | (_) | |_
                    |_||___/\__,_|_|\_|_|____/ \___/ \__|



 * Author:      Oscar "Cehhiro" Fonseca
 * Program:     TsukiBot

 * Discord bot that offers a wide range of services
 * related to cryptocurrencies.

 * No parameters on start, except -d for dev mode.

 * If you like this service, consider donating
 * ETH to my address: 0xd234168c142D2771cD96eA8d59b1f57304604533 




 * ------------------------------------------------------------------- */
/* eslint-enable */


// -------------------------------------------
// -------------------------------------------
//
//           SETUP AND DECLARATIONS
//
// -------------------------------------------
// -------------------------------------------

// File read for JSON and PostgreSQL
const fs = require('fs');
const pg = require('pg');
const pgp = require('pg-promise');
const _ = require('lodash');

// Scheduler
const schedule = require('node-schedule');

// Set the prefix
const prefix = ['-t', '.tb'];

// Files allowed
const extensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'mov', 'mp4'];

// Allowed coins in commands
const pairs = JSON.parse(fs.readFileSync('./common/coins.json', 'utf8'));
const pairsFiltered = JSON.parse(fs.readFileSync('./common/coins_filtered.json', 'utf8'));

// Coin request counter initialization
const requestCounter = pairs.reduce((counter, coin) => _.set(counter, coin, 0), {});

// Coin mention counter initialization
const MESSAGE_LIMIT = 100000;
const mentionCounter = pairsFiltered.reduce((counter, coin) => _.set(counter, coin, 0), {});

// Help string
const title = '__**TsukiBot**__ :full_moon: \n';
const github = 'Check the GitHub repo for more detailed information. <https://github.com/OFRBG/TsukiBot#command-table>';
const helpStr = fs.readFileSync('./common/help.txt', 'utf8');
const helpjson = JSON.parse(fs.readFileSync('./common/help.json', 'utf8'));

// DiscordBots API
const snekfetch = require('snekfetch');

// Get the api keys
const keys = JSON.parse(fs.readFileSync('keys.api', 'utf8'));

// Include API things
const Discord = require('discord.js');

// R script calls
const R = require('r-script');

let kliArray = {};
const kliArrayDict = {};

// CMC Cache
let cmcArray = {};
let cmcArrayDict = {};

// Spellcheck
const didyoumean = require('didyoumean');

// CryptoCompare requires global fetch
global.fetch = require('node-fetch');

// Include stuff
const PythonShell = require('python-shell');

// Declare channels and message counter
let messageCount = 0;
let referenceTime = Date.now();

// Permissions configurations
const configIDs = [];
let serverConfigs = {};
const availableCommands = ['k', 'g', 'c', 'p', 'e', 'b', 'pa', 'join', 'done'];
const emojiConfigs = ['🇰',
  '🇬',
  '🇨',
  '🇵',
  '🇪',
  '🇧',
  '💰',
  '📧',
  '✅',
];

// Array of IDs for block removal
let blockIDs = [];

// BlockIDs remove function
function removeID(id) {
  // index of the passed message.id
  const index = blockIDs.indexOf(id);

  // .indexOf returns -1 if not in array, so this checks if message is infact in blockIDs.
  if (index > -1) {
    // removes id from array
    blockIDs.splice(index, 1);
    blockIDs = blockIDs.splice(0, 4);
  }
}


// Shortcut config
const shortcutConfig = JSON.parse(fs.readFileSync('./common/shortcuts.json', 'utf8'));

// Reload Coins
const reloader = require('./getCoins');

const donationAdd = '0xd234168c142D2771cD96eA8d59b1f57304604533';
const quote = '"If I was given 1 wei for every misattributed quote, I\'d be address 0x0." -A. Lincoln';

// -------------------------------------------
// -------------------------------------------
//
//             UTILITY FUNCTIONS
//
// -------------------------------------------
// -------------------------------------------


/* --------------------------------------------

    These methods are calls on the api of the
    respective exchanges. The user can send
    an optional parameter to calculate %
    change on a base price.
    These methods are the core funcionality
    of the bot. Command calls will usually end
    in one of these.

  -------------------------------------------- */


//------------------------------------------
//------------------------------------------


// This method runs the python script that
// reads from the api's until it is killed
// from outside bot.js. It runs
// on its own.

// Create a logger for a certain set of coins
function createLogger(coins) {
  PythonShell.run('./tsukiserverlog.py', { args: coins }, (err) => { if (err) console.log(err); });
}


//------------------------------------------
//------------------------------------------


// This function runs python scripts once
// and gets their stdout output. It calls
// tsukiserver, which will call either the
// s command or the p command.

function executeCommand(c, opts, chn) {
  console.log(opts);

  const { coin } = opts;
  const arg1 = opts.arg1 || -1;
  const arg2 = opts.arg2 || 'p';

  const pyshell = new PythonShell('./tsukiserver.py', { args: [coin, arg1, arg2] });

  pyshell.send(`${c}\r\n`).end((err) => {
    if (err) {
      console.log(err);
    }
  });

  pyshell.stdout.on('data', (data) => {
    console.log(data);
    chn.send(data).then((message) => {
      message.react('\u274E');
      blockIDs.push(message.id);

      setTimeout(() => { removeID(message.id); }, 120000);
    })
      .catch(console.log);
  });
}


//------------------------------------------
//------------------------------------------

// KLI functions

function compareCoins(coin1, coin2, chn) {
  if (kliArray !== {}) {
    let msg = '__KL Comparison__\n';

    if (kliArrayDict[coin1.toUpperCase()] && kliArrayDict[coin2.toUpperCase()]) {
      const c1 = kliArrayDict[coin1.toUpperCase()];
      const c2 = kliArrayDict[coin2.toUpperCase()];

      msg += `\`Tickers:\` \`${c1['h.ticker']} ${c2['h.ticker']}\`\n`;
      msg += `\`⇒ MCap rel. sizes:\` \`${Math.exp(parseFloat(c1.x) - parseFloat(c2.x)).toFixed(4)} ⬄ ${Math.exp(parseFloat(c2.x) - parseFloat(c1.x)).toFixed(4)}\`\n`;
      msg += `\`⇒ Vol. rel. sizes:\` \`${Math.exp(parseFloat(c1.y) - parseFloat(c2.y)).toFixed(4)} ⬄ ${Math.exp(parseFloat(c2.y) - parseFloat(c1.y)).toFixed(4)}\`\n`;
    }

    chn.send(msg);
  } else {
    chn.send('Invalid crypto supplied.');
  }
}


function getKLI(coins, chn) {
  if (kliArray !== {}) {
    let msg = '__KL Index Values__\n';

    coins.forEach((v) => {
      if (kliArrayDict[v.toUpperCase()]) {
        const c = kliArrayDict[v.toUpperCase()];
        msg += `\`${c['h.ticker']}\` - \`${c.kli}\`\n`;
      }
    });

    chn.send(msg);
  }
}

//------------------------------------------
//------------------------------------------

// This is a setup for users to create
// their own arrays of coins. They can check
// the price from they array by typing .tbpa
// as a shortcut.

function getCoinArray(id, chn, coins = '', action = '') {
  const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;

  if (action === '') { coins = `{${coins}}`; }

  const conn = new pg.Client(conString);
  conn.connect();

  let query;


  // .tbpa call
  if (coins === '') {
    query = conn.query('SELECT * FROM profiles where id = $1;', [id], (err, res) => {
      if (err) { console.log(err); } else if (res.rows[0]) {
        const coins = res.rows[0].coins.filter((value) => !isNaN(value) || pairs.indexOf(value.toUpperCase()) > -1);

        getPriceCC(coins, chn, action);
      } else {
        chn.send('Set your array with `.tb pa [array]`.');
      }

      conn.end();
    });

    // .tb pa call
  } else if (action == '') {
    query = conn.query(('INSERT INTO profiles(id, coins) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET coins = $2;'), [id, coins], (err, res) => {
      if (err) { console.log(err); } else { chn.send(`Personal array set: \`${coins}\` for <@${id}>.`); }

      conn.end();
    });
  } else {
    const command = (action == '-') ? 'EXCEPT' : 'UNION';
    const sqlq = `UPDATE profiles SET coins = array(SELECT UNNEST(coins) FROM profiles WHERE id = $1 ${command} SELECT UNNEST(ARRAY[$2])) WHERE id = $1;`;
    const queryp = pgp.as.format(sqlq, [id, coins]);

    query = conn.query(queryp, (err, res) => {
      if (err) { console.log(err); } else { chn.send('Personal array modified.'); }

      conn.end();
    });
  }
}


//------------------------------------------
//------------------------------------------

// Service to self-service roles via commands in chat.
// This method currently handles the 4 following cases:
// 1. Setting the roles themselves, and creating the roles
//      as well as the channels
// 2. Setting the self roles
// 3. Getting the available roles
// 4. Removing the roles from oneself

function setSubscriptions(user, guild, coins) {
  const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;
  coins = coins.map((c) => c.toUpperCase());

  const { id } = user;

  const conn = new pg.Client(conString);
  conn.connect();

  let sqlq;

  const change = coins[0] === 'M'; // Change the currently officially supported roles by merge
  const remove = coins[0] === 'R'; // Unsub from everything
  const getlst = coins[0] === 'G'; // Get the current role list
  const restore = coins[0] === 'S'; // Resub to the subbed roled

  // Case R
  if (remove || getlst) {
    sqlq = 'SELECT coins FROM allowedby WHERE guild = $3;';

    // Case default
  } else if (!change) {
    sqlq = 'WITH arr AS '
      + '(SELECT ARRAY( SELECT * FROM UNNEST($2) WHERE UNNEST = ANY( ARRAY[(SELECT coins FROM allowedby WHERE guild = $3)] ))) '
      + 'INSERT INTO coinsubs(id, coins) VALUES($1, (select * from arr)) '
      + 'ON CONFLICT ON CONSTRAINT coinsubs_pkey DO '
      + 'UPDATE SET coins=(SELECT ARRAY( SELECT * FROM UNNEST($2) WHERE UNNEST = ANY( ARRAY[(SELECT coins FROM allowedby WHERE guild = $3)] ))) RETURNING coins;';

    // Case M
  } else {
    sqlq = 'INSERT INTO allowedby VALUES($3, $2) ON CONFLICT (guild) '
      + 'DO UPDATE SET coins = ARRAY(SELECT UNNEST(coins) FROM (SELECT coins FROM allowedby WHERE guild = $3) AS C0 UNION SELECT * FROM UNNEST($2)) RETURNING coins;';
    coins.splice(0, 1);
  }


  // Format in a predictable way
  const queryp = pgp.as.format(sqlq, [id, coins, guild.id]);

  // Execute the query
  const query = conn.query(queryp, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      const { roles } = guild;
      const coinans = (res.rows[0] !== undefined) ? (getlst ? res.rows[0].coins : res.rows[0].coins.map((c) => `${c}Sub`)) : 'your server doesn\'t have subroles (monkaS)';

      const added = new Array();

      guild.fetchMember(user)
        .then((gm) => {
          roles.forEach((r) => {
            if (coinans.indexOf(r.name) > -1) {
              added.push(r.name); (!change && !getlst) ? (!restore && remove ? gm.removeRole(r).catch(0)
                : gm.addRole(r)).catch(0) : (0);
            }
          });

          user.send(getlst ? `Available roles are: \`[${coinans.join(' ')}]\`.`
            : (remove ? 'Unsubbed.'
              : (!change ? (`Subscribed to \`[${added.join(' ')}]\`.`)
                : ('Added new roles. I cannot delete obsolete sub roles. Those need to be removed manually.'))));

          if (!change) return;


          // If the operation is to add a new role,
          // this section cycles over the returned
          // list and names it foosubs, assigns the
          // role a random color, and makes it private.

          for (const cr in coinans) {
            if (added.indexOf(coinans[cr]) === -1) {
              guild.createRole({
                name: coinans[cr],
                color: 'RANDOM',
                mentionable: true,
              })
                .then((r) => {
                  guild.createChannel(`${r.name}s`, 'text', [{ id: r.id, type: 'role', allow: 1024 },
                    { id: guild.roles.find((r) => r.name === '@everyone').id, type: 'role', deny: 1024 }])
                    .then(console.log)
                    .catch(console.log);
                })
                .catch(console.log);
            }
          }
        })
        .catch(console.log);
    }

    conn.end();
  });
}


// -------------------------------------------
// -------------------------------------------
//
//             PERMISSION MGMT
//
// -------------------------------------------
// -------------------------------------------

// Get a name for a role and save it into
// the permissions database.
//
//   Note: Currently inserting only type 3.
//   Type 1: Admin
//   Type 2: User
//   Type 3: Temporary

function setRoles(name, guild, chn) {
  const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;
  const code = name.toUpperCase().slice(0, 20);

  guild.createRole({
    name,
    color: 'RANDOM',
    mentionable: true,
  })
    .then((r) => {
      const conn = new pg.Client(conString);
      conn.connect();

      const sqlq = 'INSERT INTO roleperms VALUES($1, $2, $3, $4);';
      const queryp = pgp.as.format(sqlq, [r.id, guild.id, 3, code]);

      const query = conn.query(queryp, (err, res) => {
        if (err) { console.log(err); } else { chn.send(`Created role \`${r.name}\`.`); }

        conn.end();
      });
    })
    .catch(console.log);
}


//------------------------------------------
//------------------------------------------

// Give a temporary role to a user
// and save the timstamps to the
// database.

function temporarySub(id, code, guild, chn, term) {
  const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;
  term = term || 1;
  code = code.toUpperCase().slice(0, 20);

  const conn = new pg.Client(conString);
  conn.connect();

  const sqlq = "INSERT INTO temporaryrole VALUES(DEFAULT, $1, (SELECT roleid FROM roleperms WHERE guild = $2 AND function = 3 AND code = $3 LIMIT 1), current_timestamp, current_timestamp + (30 * interval '$4 day')) RETURNING roleid;";
  const queryp = pgp.as.format(sqlq, [id, guild.id, code, term]);

  const query = conn.query(queryp, (err, res) => {
    if (err) { console.log(err); if (err.column == 'roleid') chn.send(`Role \`${code}\` not found.`); } else {
      const role = guild.roles.get(res.rows[0].roleid);
      guild.fetchMember(id)
        .then((gm) => {
          gm.addRole(role).catch(0);
          chn.send(`Added subscriber \`${gm.displayName}\` to role \`${role.name}\`.`);
        })
        .catch(console.log);
    }

    conn.end();
  });
}


//------------------------------------------
//------------------------------------------

// Give a temporary role to a user
// and save the timstamps to the
// database.

function checkSubStatus() {
  const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;

  const conn = new pg.Client(conString);
  conn.connect();

  const sqlq = 'SELECT subid, guild, temporaryrole.roleid, userid FROM roleperms, temporaryrole WHERE temporaryrole.roleid = roleperms.roleid AND end_date < current_date;';
  const queryp = pgp.as.format(sqlq);

  const query = conn.query(queryp, (err, res) => {
    if (err) { console.log(err); } else {
      for (const expired in res.rows) {
        const line = res.rows[expired];
        const guild = client.guilds.get(line.guild);
        const entry = line.subid;
        const deleteids = [];

        if (guild != null) {
          const role = guild.roles.get(line.roleid);

          guild.fetchMember(line.userid)
            .then((gm) => {
              gm.removeRole(role)
                .then((gm) => {
                  deleteids.push(entry);
                })
                .catch((e) => deleteids.push(entry));
            })
            .catch((e) => { if (e.code === 10013) deleteids.push(entry); });
        } else {
          deleteids.push(entry);
        }


        if (deleteids.length > 0) {
          const conn2 = new pg.Client(conString);
          conn2.connect();

          const sqlq = `DELETE FROM temporaryrole WHERE subid IN (${deleteids.join(',')});`;
          const queryp = pgp.as.format(sqlq);

          const query = conn2.query(queryp, (err, res) => {
            console.log('run delete');
            console.log(sqlq);

            if (err) { console.log('error:', err); } else { console.log('Deleted entries'); }

            conn2.end();
          });
        }
      }
    }
    conn.end();
  });
}

function checkMentions(msg, msgAcc, mentionCounter) {
  return new Promise(((resolve, reject) => {
    const conString = `postgres://tsukibot:${keys.tsukibot}@localhost:5432/tsukibot`;
    const conn = new pg.Client(conString);

    msgAcc = `${msgAcc} ${msg}`;

    if (msgAcc.length > MESSAGE_LIMIT) {
      const acc = msgAcc.split(' ');

      for (const w in acc) {
        if (pairs_filtered.indexOf(acc[w].toUpperCase()) > -1) mentionCounter[acc[w].toUpperCase()]++;
      }


      conn.connect();

      let queryline = '';
      for (const c in mentionCounter) {
        const sqlq = 'INSERT INTO mentiondata VALUES($1, $2, current_timestamp, DEFAULT);';
        const queryp = pgp.as.format(sqlq, [c, mentionCounter[c]]);

        queryline += queryp;
      }

      const query = conn.query(queryline, (err, res) => {
        if (err) { console.log(err); } else { console.log('insertion complete'); }

        conn.end();
      });

      resolve(mentionCounter);
    }
  }));
}


// -------------------------------------------
// -------------------------------------------
//
//              DISCORD FUNCTIONS
//
// -------------------------------------------
// -------------------------------------------

// Create a client and a token
const client = new Discord.Client();
const token = keys.discord;


// Wait for the client to be ready.
client.on('ready', () => {
  if (process.argv[2] === '-d') {
    console.log('dev mode');
  }

  console.log('------------------ Bot start ------------------');

  client.user.setActivity('.tbhelp');

  fs.readFile('common/serverPerms.json', (err, data) => {
    if (err) return console.log(err);

    serverConfigs = JSON.parse(data);
  });

  const deleter = schedule.scheduleJob('42 * * * *', checkSubStatus);
  // var mentionLog   = schedule.scheduleJob('42 * * * * *', checkMentions);

  const klindex = schedule.scheduleJob('*/1 * * * *', getKLIndex);
  const cmcfetch = schedule.scheduleJob('*/1 * * * *', getCMCData);
  const csvsend = schedule.scheduleJob('*/10 * * * *', sendCSV);
  const updateList = schedule.scheduleJob('* * 12 * *', updateCoins);

  updateCoins();
  getKLIndex();
  getCMCData();

  client.fetchUser('217327366102319106')
    .then((u) => {
      u.send('TsukiBot loaded.')
        .catch(console.log);
    })
    .catch(console.log);
});

function postHelp(author, code) {
  code = code || 'none';
  if (code === 'ask' || helpjson[code] !== undefined) {
    const helptext = code === 'none' || helpjson[code] === undefined ? helpStr : `Format for ${helpjson[code][0]}\`${prefix[1]}\` ${helpjson[code][1]}`;
    author.send(helptext);
  } else {
    author.send('Use `.tbhelp` to get a list of commands and their usage.');
  }
}


client.on('guildCreate', (guild) => {
  if (guild.defaultChannel) {
    guild.defaultChannel.send('ありがとう! Get a list of commands with `.tbhelp`.');
  }
  guild.createRole({
    name: 'File Perms',
    color: 'BLUE',
  })
    .then((role) => {
      if (guild.defaultChannel) guild.defaultChannel.send(`Created role ${role} for users who should be allowed to send files!`);
    })
    .catch(console.error);
});

// Event goes off every time a message is read.
client.on('message', (message) => {
  // Developer mode
  if (process.argv[2] === '-d' && message.author.id !== '217327366102319106') return;

  // Check for Ghost users
  if (message.author == null) return;

  // Keep a counter of messages
  messageCount = (messageCount + 1) % 10000;
  if (messageCount === 0) referenceTime = Date.now();

  // Try to add File Perms Role
  if (message.guild && !message.guild.roles.exists('name', 'File Perms')) {
    message.guild.createRole({
      name: 'File Perms',
      color: 'BLUE',
    })
      .then((role) => message.channel.send(`Created role ${role} for users who should be allowed to send files!`))
      .catch((e) => (0));
  }

  // Remove possibly unsafe files
  if (message.member && !message.member.roles.exists('name', 'File Perms')) {
    for (const a of message.attachments) {
      if (extensions.indexOf(((ar) => ar[ar.length - 1])(a[1].filename.split('.')).toLowerCase()) === -1) {
        message.delete().then((msg) => console.log(`Deleted message from ${msg.author}`)).catch(0);
        return;
      }
    }
  }


  // Update every 1000 messages
  if (Math.floor(Math.random() * 1000) === 42) {
    snekfetch.post(`https://discordbots.org/api/bots/${client.user.id}/stats`)
      .set('Authorization', keys.dbots)
      .send({ server_count: client.guilds.size })
      .then(console.log('updated dbots.org status.'))
      .catch((e) => console.warn('dbots.org down'));
  }

  // Check if it's a DM channel
  if (message.channel.type !== 'text') return;


  // Get the permission settigs
  const config = serverConfigs[message.guild.id] || [];


  // Check for perms (temporary)
  message.guild.fetchMember(message.author)
    .then((gm) => {
      try {
        commands(message, gm.roles.some((r) => r.name === 'TsukiBoter'), config);
      } catch (e) {
        console.log(e);
      }
    })
    .catch((e) => (0));
});

/* -------------------------------------------------------

   This is the main method. It gets the current message
   and a boolean that states if the sender has a
   botAdmin role.

   The first section checks for multi-parameter inputs,
   such as k or c. Multi-parameter inputs have the
   format [prefix] [command] [parameters].

   The second section checks for simple parameter
   inputs. These are of the form [prefix][command].

   These cases default to posting the help text. The
   reference text is found in common/help.txt.

 ------------------------------------------------------- */


function commands(message, botAdmin, config) {
  // Get the channel where the bot will answer.
  const { channel } = message;

  // Split the message by spaces.
  const code_in = message.content.split(' ').filter((v) => v !== '');
  if (code_in.length < 1) return;

  // Check for prefix start.
  let hasPfx = '';
  prefix.map((pfx) => hasPfx = (code_in[0].indexOf(pfx) === 0 ? pfx : hasPfx));

  // Cut the prefix.
  const code_in_pre = code_in[0];
  code_in[0] = code_in[0].replace(hasPfx, '');

  // Check for bot prefix
  if (hasPfx === '') {
    if (shortcutConfig[message.guild.id] === code_in[0].toLowerCase()) {
      code_in.shift();
      getPriceCMC(code_in, channel, '-');
    }
  } else if (prefix.indexOf(code_in_pre) > -1) {
    // Remove the prefix stub
    code_in.splice(0, 1);

    // Get the command
    const command = code_in[0];

    // Check if there is content
    if (code_in.length > 1 && code_in.length < 30) {
      /* --------------------------------------------------------------------------------
        First we need to get the supplied coin list. Then we apply a filter function.

        Coins not found are skipped for the commands.
      ---------------------------------------------------------------------------------- */

      const params = code_in.slice(1, code_in.length).filter((value) => {
        // --------- Request Counter ---------------------------------------------------
        if (code_in[0] !== 'e' && code_in[0] !== 'sub' && code_in[0] !== 'subrole') {
          requestCounter[value.toUpperCase()]++;
        }
        // -----------------------------------------------------------------------------

        return !isNaN(value) || pairs.indexOf(value.toUpperCase()) > -1;
      });

      // Keeping the pad
      params.unshift('0');

      if (config.indexOf(command) === -1 && (params.length > 1 || ['cmc', 'shortcut', 'subrole', 'sub'].indexOf(command) > -1)) {
        // GDAX call
        if (command === 'gdax' || command === 'g') {
          getPriceGDAX(params[1], 'USD', (params[2] != null && !isNaN(params[2]) ? params[2] : -1), channel);

          // Kraken call
        } else if (command === 'krkn' || command === 'k') {
          getPriceKraken(params[1], (params[2] === null ? 'USD' : params[2]), (params[3] != null && !isNaN(params[3]) ? params[3] : -1), channel);

          // Finex call
        } else if (command === 'bfx' || command === 'f') {
          getPriceFinex(params[1], params[2] === null ? '' : params[2], channel);

          // CMC call
        } else if (command === 'cmc' || command === 'cmcs') {
          const ext = command.slice(-1);
          code_in.splice(0, 1);
          getPriceCMC(code_in, channel, '-', ext);

          // CryptoCompare call
        } else if (command === 'crcp' || command === 'c' || command === 'cs') {
          const ext = command.slice(-1);
          params.splice(0, 1);
          getPriceCC(params, channel, '-', ext);

          // KLI call (skip the filter)
        } else if (command === 'kli') {
          code_in.splice(0, 1);
          getKLI(code_in, channel);

          // Compare call (skip the filter)
        } else if (command === 'mc') {
          compareCoins(code_in[1], (code_in[2] ? code_in[2] : 'BTC'), channel);

          // Configure personal array
        } else if (/pa[\+\-]?/.test(command)) {
          const action = command[2] || '';
          params.splice(0, 1);

          params.map((x) => x.toUpperCase());
          getCoinArray(message.author.id, channel, params, action);

          // Set coin roles
        } else if (command === 'join') {
          params.splice(0, 1);
          setSubscriptions(message.author, message.guild, params);

          // Toggle shortcut
        } else if (command === 'shortcut') {
          if (hasPermissions(message.author.id, message.guild) || botAdmin) {
            toggleShortcut(message.guild.id, code_in[1], channel);
          }

          // Set coin role perms
        } else if (command === 'makeroom') {
          if (hasPermissions(message.author.id, message.guild) || botAdmin) {
            params.splice(0, 1);
            params.unshift('m');
            setSubscriptions(message.author, message.guild, params);
          }

          // Poloniex call
        } else if (command === 'polo' || command === 'p') {
          getPricePolo(params[1], (params[2] == null ? 'BTC' : params[2]), channel);

          // Bittrex call
        } else if (command === 'bit' || command === 'b') {
          getPriceBittrex(params.slice(1, params.size), (params[2] != null && params[2][0] === '-' ? params[2] : 'BTC'), channel);

          // Binance call (no filter)
        } else if (command === 'bin' || command === 'm' || command === 'n') {
          getPriceBinance(code_in.slice(1, params.size), (code_in[2] != null && code_in[2][0] === '-' ? code_in[2] : 'BTC'), channel);

          // Etherscan call
        } else if ((command === 'escan' || command === 'e')) {
          if (params[1].length == 42) {
            getEtherBalance(params[1], channel);
          } else if (params[1].length == 66) {
            getEtherBalance(params[1], channel, 'tx');
          } else {
            channel.send('Format: `.tb e [HEXADDRESS or TXHASH]` (with prefix 0x).');
          }

          // Give a user an expiring role
        } else if (command === 'sub') {
          if (hasPermissions(message.author.id, message.guild)) {
            if (typeof (code_in[2]) === 'string' && message.mentions.users.size > 0) {
              message.mentions.users.forEach((u) => { temporarySub(u.id, code_in[2], message.guild, message.channel); });
            } else {
              channel.send('Format: `.tb sub @user rolename`.');
            }
          }

          // Create an expiring role
        } else if (command === 'subrole') {
          if (hasPermissions(message.author.id, message.guild)) {
            if (typeof (code_in[1]) === 'string') {
              setRoles(code_in[1], message.guild, message.channel);
            } else {
              channel.send('Format: `.tb subrole Premium`. (The role title is trimmed to 20 characters.)');
            }
          }

          // Catch-all help
        } else {
          postHelp(channel, command);
        }
      } else {
        postHelp(channel, command);
      }
    } else {
      postHelp(channel, command);
    }

    // Shortcut section
  } else {
    const scommand = code_in[0];

    // Get DiscordID via DM
    if (scommand === 'id') {
      message.author.send(`Your ID is \`${message.author.id}\`.`);

      // Remove the sub tags
    } else if (scommand === 'leave') {
      setSubscriptions(message.author, message.guild, ['r']);

      // Load configuration message
    } else if (scommand === 'config') {
      if (hasPermissions(message.author.id, message.guild) || botAdmin) loadConfiguration(message);

      // Restore the sub tags
    } else if (scommand === 'resub') {
      setSubscriptions(message.author, message.guild, ['S']);

      // Get personal array prices
    } else if (/pa[\+\-\*]?/.test(scommand)) {
      // ----------------------------------------------------------------------------------------------------------------
      // ----------------------------------------------------------------------------------------------------------------
      if (message.author.id !== client.user.id) {
        ProductRegister.methods.checkPayment(message.author.id).call()
          .then((paid) => {
            if (paid) {
              getCoinArray(message.author.id, channel, '', scommand[2] || '-');
            } else {
              channel.send('Please pay (free KETH) for this service. Visit https://www.tsukibot.com on the Kovan Network.');
            }
          })
          .catch(console.log);
      }
      // ----------------------------------------------------------------------------------------------------------------
      // ----------------------------------------------------------------------------------------------------------------

      // Get available roles
    } else if (scommand === 'list') {
      code_in.splice(0, 1);
      code_in.unshift('g');
      setSubscriptions(message.author, message.guild, code_in);

      // Get GDAX ETHX
    } else if (scommand === 'g') {
      if (code_in[1] && code_in[1].toUpperCase() === 'EUR') {
        getPriceGDAX('ETH', 'EUR', -1, channel);
      } else if (code_in[1] && code_in[1].toUpperCase() === 'BTC') {
        getPriceGDAX('BTC', 'USD', -1, channel);
      } else {
        getPriceGDAX('ETH', 'USD', -1, channel);
      }

      // Get Kraken ETHX
    } else if (scommand === 'k') {
      if (code_in[1] && code_in[1].toUpperCase() === 'EUR') {
        getPriceKraken('ETH', 'EUR', -1, channel);
      } else if (code_in[1] && code_in[1].toUpperCase() === 'BTC') {
        getPriceKraken('XBT', 'USD', -1, channel);
      } else {
        getPriceKraken('ETH', 'USD', -1, channel);
      }

      // Get Poloniex ETHBTC
    } else if (scommand === 'p') {
      getPricePolo('ETH', 'BTC', channel);

      // Get prices of popular currencies
    } else if (scommand === 'pop') {
      getPriceCC(['ETH', 'BTC', 'XRP', 'LTC', 'GNT'], channel);

      // Get Bittrex ETHBTC
    } else if (scommand === 'b') {
      getPriceBittrex('ETH', 'BTC', channel);

      // Call help scommand
    } else if (scommand === 'help' || scommand === 'h') {
      postHelp(message.author, 'ask');

      // Call KL Index
    } else if (scommand === 'kli') {
      const title = 'KL Index Highs';
      let kl = '';
      kliArray.forEach((v) => {
        if (v['h.ticker'] !== 'USDT' && v.x > -10 && v.kli > 0.1) kl += `\`${v['h.ticker']}\` - \`${v.kli}\`\n`;
      });

      const embed = new Discord.RichEmbed()
        .addField(title, kl)
        .setColor('WHITE')
        .setFooter('Part of CehhNet', 'https://imgur.com/OG77bXa.png');

      channel.send({ embed });

      // Statistics
    } else if (scommand === 'stat') {
      const users = (client.guilds.reduce((sum, guild) => sum + guild.memberCount, 0));
      const guilds = (client.guilds.size);
      const msgpersec = Math.trunc(messageCount * 1000 * 60 / (Date.now() - referenceTime));
      const topCrypto = coinArrayMax(requestCounter);
      const popCrypto = coinArrayMax(mentionCounter);


      const msgh = (`Serving \`${users}\` users from \`${guilds}\` servers.\n`
        + `⇒ Current uptime is: \`${Math.trunc(client.uptime / (3600000))}hr\`.\n`
        + `⇒ Current messages per minute is \`${msgpersec}\`.\n${
          topCrypto[1] > 0 ? `⇒ Top requested crypto: \`${topCrypto[0]}\` with \`${topCrypto[1]}%\` dominance.\n` : ''
        }${popCrypto[1] > 0 ? `⇒ Top mentioned crypto: \`${popCrypto[0]}\` with \`${popCrypto[1]}%\` dominance.\n` : ''
        }⇒ Support or share Tsuki here: <https://discordbots.org/bot/tsuki>.\n`
        + '`⇒ ETH donations appreciated at: 0xd234168c142D2771cD96eA8d59b1f57304604533.`');

      const embed = new Discord.RichEmbed()
        .addField('TsukiBot Stats', msgh)
        .setColor('WHITE')
        .setThumbnail('https://imgur.com/7pLQHei.png')
        .setFooter('Part of CehhNet', 'https://imgur.com/OG77bXa.png');

      channel.send({ embed });

      // Meme
    } else if (scommand === '.dank') {
      channel.send(':ok_hand:           :tiger:' + '\n'
        + ' :eggplant: :zzz: :necktie: :eggplant:' + '\n'
        + '                  :oil:     :nose:' + '\n'
        + '            :zap:  8=:punch: =D:sweat_drops:' + '\n'
        + '         :trumpet:   :eggplant:                       :sweat_drops:' + '\n'
        + '          :boot:    :boot:');

      // Another meme
    } else if (scommand === '.moonwhen') {
      channel.send('Soon™');
    }
  }
}

// -------------------------------------------
// -------------------------------------------
//
//           SUPPORTING FUNCTIONS
//
// -------------------------------------------
// -------------------------------------------

function coinArrayMax(counter) {
  let max = 0;
  let sum = 1;
  let maxCrypto = '';

  for (const key in counter) {
    sum += counter[key];
    if (counter[key] !== 0) console.log(`${counter[key]} ${key}`);
    if (counter[key] > max) {
      max = counter[key];
      maxCrypto = key;
    }
  }

  console.log(counter);
  return [maxCrypto, Math.trunc((max / sum) * 100)];
}

function loadConfiguration(msg) {
  const { channel } = msg;

  channel.send('__**Commands**__\n\n'
    + ':regional_indicator_k: = Kraken\n\n'
    + ':regional_indicator_g: = GDAX\n\n'
    + ':regional_indicator_c: = CryptoCompare\n\n'
    + ':regional_indicator_p: = Poloniex\n\n'
    + ':regional_indicator_e: = Etherscan\n\n'
    + ':regional_indicator_b: = Bittrex\n\n'
    + ':moneybag: = Volume\n\n'
    + ':envelope: = Subscription Channels\n\n'
    + '`React to the according symbols below to disable a service. Save settings with the checkmark.`')
    .then((msg) => {
      configIDs.push(msg.id);
      msg.react(emojiConfigs[0]).catch(console.log);
    });
}


/* ----------------------------------------------------

 EventHandler for reactions added.

   This event handles 2 functions.
   1. Delete messages when the cross emoji is added.
   2. Post the reactions to the server settings.
    2a. First it will recursively add the emoji reacts
    2b. Then it will react when the checkmark is pressed

 ----------------------------------------------------- */

client.on('messageReactionAdd', (messageReaction, user) => {
  const { message } = messageReaction;
  const guild = messageReaction.message.guild.id;
  const { reactions } = messageReaction.message;

  // Function 1
  if (removeID(messageReaction.message.id) != -1 && messageReaction.emoji.identifier == '%E2%9D%8E' && messageReaction.count == 2) {
    messageReaction.message.delete().catch();
  }


  // Function 2a.
  if (configIDs.indexOf(message.id) > -1 && reactions.size < emojiConfigs.length) {
    message.react(emojiConfigs[emojiConfigs.indexOf(messageReaction.emoji.toString()) + 1]).catch(console.log);
  }

  // Function 2b.
  if (configIDs.indexOf(message.id) > -1 && reactions.size === emojiConfigs.length) { // Finished placing options
    if (messageReaction.emoji.toString() === emojiConfigs[emojiConfigs.length - 1]) { // Reacted to checkmark
      if (hasPermissions(user.id, message.guild)) { // User has permissions
        // Get from the reactions those which have reactions from someone with permissions
        const validPerms = reactions.filter((r) => r.users.some((e, i, a) => hasPermissions(e.id, message.guild)));

        // Get an array form of the permissions
        serverConfigs[guild] = validPerms.map((e) => availableCommands[emojiConfigs.indexOf(e.emoji.toString())]);

        // Write to a file for storage
        fs.writeFile('common/serverPerms.json', JSON.stringify(serverConfigs), (err) => {
          if (err) return console.log(err);
          console.log('Server config saved');
        });

        // Delete the message
        message.delete()
          .then(() => {
            if (serverConfigs[guild].length > 1) {
              message.channel.send(`**Settings updated**\nBlocked services: \`${serverConfigs[guild].slice(0, -1).join(' ')}\`.`)
                .catch(console.log);
            }
          })
          .catch(console.log);
      }
    }
  }
});

/* ---------------------------------

  getCMCData()

  Update the array every 5 minutes
  (Endpoint update rate)

 ---------------------------------- */


async function getCMCData() {
  cmcArray = await clientcmc.ticker({ limit: 0 });

  cmcArrayDict = {};
  cmcArray.forEach((v) => {
    if (!cmcArrayDict[v.symbol]) cmcArrayDict[v.symbol] = v;
  });
}

/* ---------------------------------

  getKLIndex()

  Assign the top KL Index coins

 ---------------------------------- */

function sendCSV() {
}

function updateCoins() {
  reloader.update()
    .then((arr) => {
      pairs = arr[0].slice();
      pairs_filtered = arr[1].slice();

      console.log('Reloaded coins');
    })
    .catch((e) => console.error(`Failed update: ${e}`));
}


function getKLIndex() {
  try {
    kliArray = R('kl_idx.R').callSync();

    kliArray.forEach((v) => {
      kliArrayDict[v['h.ticker']] = v;
    });
  } catch (e) {
    console.log(`${e}: failed R script execution`);
  }
}

/* ---------------------------------

  toggleShortcut(guildid, string, channel)

 ---------------------------------- */

function toggleShortcut(id, shortcut, chn) {
  if (/(\w|[!$%._,<>=+*&]){1,3}/.test(shortcut) && shortcut.length < 4) {
    shortcutConfig[id] = shortcut;

    fs.writeFile('common/shortcuts.json', JSON.stringify(shortcutConfig), (err) => {
      if (err) return console.log(err);

      chn.send(`Set shortcut to \`${shortcut}\`.`);
      console.log('Shortcut config saved');
    });
  } else {
    chn.send('Shortcut format not allowed. (Max. 3 alphanumeric and `!$%._,<>=+*&`)');
  }
}

/* ---------------------------------

  hasPermissions(id, guild)

  id) has to be the ID of the user,
  regardless of the original type of
  object.

  guild) is the guild object where
  the action is executed.

 ---------------------------------- */

function hasPermissions(id, guild) {
  return guild.owner.id === id;
}


// Error event logging
client.on('error', (err) => {
  console.log(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


// Jack in, Megaman. Execute.
client.login(token);

// -------------------------------------------
// -------------------------------------------
// -------------------------------------------
//
//            for a better world.
//
// -------------------------------------------
// -------------------------------------------
// -------------------------------------------
