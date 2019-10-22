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
const _ = require('lodash');

// Set the prefix
const prefix = ['-t', '.tb'];

// Allowed coins in commands
const pairs = JSON.parse(fs.readFileSync('./common/coins.json', 'utf8'));
const pairsFiltered = JSON.parse(
  fs.readFileSync('./common/coins_filtered.json', 'utf8')
);

// Coin request counter initialization
const requestCounter = pairs.reduce(
  (counter, coin) => _.set(counter, coin, 0),
  {}
);

// Coin mention counter initialization
const MESSAGE_LIMIT = 100000;
const mentionCounter = pairsFiltered.reduce(
  (counter, coin) => _.set(counter, coin, 0),
  {}
);

// Get the api keys
const keys = JSON.parse(fs.readFileSync('keys.api', 'utf8'));

// Include API things
const Discord = require('discord.js');

// CryptoCompare requires global fetch
global.fetch = require('node-fetch');

// Declare channels and message counter
let messageCount = 0;
let referenceTime = Date.now();

// Permissions configurations
const configIDs = [];
const availableCommands = ['k', 'g', 'c', 'p', 'e', 'b', 'pa', 'join', 'done'];
const emojiConfigs = ['🇰', '🇬', '🇨', '🇵', '🇪', '🇧', '💰', '📧', '✅'];

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

client.on('ready', () => {});
client.on('guildCreate', guild => {});
client.on('message', message => {
  // Developer mode
  if (process.argv[2] === '-d' && message.author.id !== '217327366102319106')
    return;

  // Check for Ghost users
  if (message.author == null) return;

  // Keep a counter of messages
  messageCount = (messageCount + 1) % 10000;
  if (messageCount === 0) referenceTime = Date.now();

  // Try to add File Perms Role
  if (message.guild && !message.guild.roles.exists('name', 'File Perms')) {
    message.guild
      .createRole({
        name: 'File Perms',
        color: 'BLUE'
      })
      .then(role =>
        message.channel.send(
          `Created role ${role} for users who should be allowed to send files!`
        )
      )
      .catch(e => 0);
  }

  // Remove possibly unsafe files
  if (message.member && !message.member.roles.exists('name', 'File Perms')) {
    for (const a of message.attachments) {
      if (
        extensions.indexOf(
          (ar => ar[ar.length - 1])(a[1].filename.split('.')).toLowerCase()
        ) === -1
      ) {
        message
          .delete()
          .then(msg => console.log(`Deleted message from ${msg.author}`))
          .catch(0);
        return;
      }
    }
  }

  // Update every 1000 messages
  if (Math.floor(Math.random() * 1000) === 42) {
    snekfetch
      .post(`https://discordbots.org/api/bots/${client.user.id}/stats`)
      .set('Authorization', keys.dbots)
      .send({ server_count: client.guilds.size })
      .then(console.log('updated dbots.org status.'))
      .catch(e => console.warn('dbots.org down'));
  }

  // Check if it's a DM channel
  if (message.channel.type !== 'text') return;

  // Get the permission settigs
  const config = serverConfigs[message.guild.id] || [];

  // Check for perms (temporary)
  message.guild
    .fetchMember(message.author)
    .then(gm => {
      try {
        commands(message, gm.roles.some(r => r.name === 'TsukiBoter'), config);
      } catch (e) {
        console.log(e);
      }
    })
    .catch(e => 0);
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
  const code_in = message.content.split(' ').filter(v => v !== '');
  if (code_in.length < 1) return;

  // Check for prefix start.
  let hasPfx = '';
  prefix.map(pfx => (hasPfx = code_in[0].indexOf(pfx) === 0 ? pfx : hasPfx));

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

      const params = code_in.slice(1, code_in.length).filter(value => {
        // --------- Request Counter ---------------------------------------------------
        if (
          code_in[0] !== 'e' &&
          code_in[0] !== 'sub' &&
          code_in[0] !== 'subrole'
        ) {
          requestCounter[value.toUpperCase()]++;
        }
        // -----------------------------------------------------------------------------

        return !isNaN(value) || pairs.indexOf(value.toUpperCase()) > -1;
      });

      // Keeping the pad
      params.unshift('0');

      if (
        config.indexOf(command) === -1 &&
        (params.length > 1 ||
          ['cmc', 'shortcut', 'subrole', 'sub'].indexOf(command) > -1)
      ) {
        // GDAX call
        if (command === 'gdax' || command === 'g') {
          getPriceGDAX(
            params[1],
            'USD',
            params[2] != null && !isNaN(params[2]) ? params[2] : -1,
            channel
          );

          // Kraken call
        } else if (command === 'krkn' || command === 'k') {
          getPriceKraken(
            params[1],
            params[2] === null ? 'USD' : params[2],
            params[3] != null && !isNaN(params[3]) ? params[3] : -1,
            channel
          );

          // Finex call
        } else if (command === 'bfx' || command === 'f') {
          getPriceFinex(
            params[1],
            params[2] === null ? '' : params[2],
            channel
          );

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
          compareCoins(code_in[1], code_in[2] ? code_in[2] : 'BTC', channel);

          // Configure personal array
        } else if (/pa[\+\-]?/.test(command)) {
          const action = command[2] || '';
          params.splice(0, 1);

          params.map(x => x.toUpperCase());
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
          getPricePolo(
            params[1],
            params[2] == null ? 'BTC' : params[2],
            channel
          );

          // Bittrex call
        } else if (command === 'bit' || command === 'b') {
          getPriceBittrex(
            params.slice(1, params.size),
            params[2] != null && params[2][0] === '-' ? params[2] : 'BTC',
            channel
          );

          // Binance call (no filter)
        } else if (command === 'bin' || command === 'm' || command === 'n') {
          getPriceBinance(
            code_in.slice(1, params.size),
            code_in[2] != null && code_in[2][0] === '-' ? code_in[2] : 'BTC',
            channel
          );

          // Etherscan call
        } else if (command === 'escan' || command === 'e') {
          if (params[1].length == 42) {
            getEtherBalance(params[1], channel);
          } else if (params[1].length == 66) {
            getEtherBalance(params[1], channel, 'tx');
          } else {
            channel.send(
              'Format: `.tb e [HEXADDRESS or TXHASH]` (with prefix 0x).'
            );
          }

          // Give a user an expiring role
        } else if (command === 'sub') {
          if (hasPermissions(message.author.id, message.guild)) {
            if (
              typeof code_in[2] === 'string' &&
              message.mentions.users.size > 0
            ) {
              message.mentions.users.forEach(u => {
                temporarySub(u.id, code_in[2], message.guild, message.channel);
              });
            } else {
              channel.send('Format: `.tb sub @user rolename`.');
            }
          }

          // Create an expiring role
        } else if (command === 'subrole') {
          if (hasPermissions(message.author.id, message.guild)) {
            if (typeof code_in[1] === 'string') {
              setRoles(code_in[1], message.guild, message.channel);
            } else {
              channel.send(
                'Format: `.tb subrole Premium`. (The role title is trimmed to 20 characters.)'
              );
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
      if (hasPermissions(message.author.id, message.guild) || botAdmin)
        loadConfiguration(message);

      // Restore the sub tags
    } else if (scommand === 'resub') {
      setSubscriptions(message.author, message.guild, ['S']);

      // Get personal array prices
    } else if (/pa[\+\-\*]?/.test(scommand)) {
      // ----------------------------------------------------------------------------------------------------------------
      // ----------------------------------------------------------------------------------------------------------------
      if (message.author.id !== client.user.id) {
        ProductRegister.methods
          .checkPayment(message.author.id)
          .call()
          .then(paid => {
            if (paid) {
              getCoinArray(message.author.id, channel, '', scommand[2] || '-');
            } else {
              channel.send(
                'Please pay (free KETH) for this service. Visit https://www.tsukibot.com on the Kovan Network.'
              );
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
      kliArray.forEach(v => {
        if (v['h.ticker'] !== 'USDT' && v.x > -10 && v.kli > 0.1)
          kl += `\`${v['h.ticker']}\` - \`${v.kli}\`\n`;
      });

      const embed = new Discord.RichEmbed()
        .addField(title, kl)
        .setColor('WHITE')
        .setFooter('Part of CehhNet', 'https://imgur.com/OG77bXa.png');

      channel.send({ embed });

      // Statistics
    } else if (scommand === 'stat') {
      const users = client.guilds.reduce(
        (sum, guild) => sum + guild.memberCount,
        0
      );
      const guilds = client.guilds.size;
      const msgpersec = Math.trunc(
        (messageCount * 1000 * 60) / (Date.now() - referenceTime)
      );
      const topCrypto = coinArrayMax(requestCounter);
      const popCrypto = coinArrayMax(mentionCounter);

      const msgh =
        `Serving \`${users}\` users from \`${guilds}\` servers.\n` +
        `⇒ Current uptime is: \`${Math.trunc(client.uptime / 3600000)}hr\`.\n` +
        `⇒ Current messages per minute is \`${msgpersec}\`.\n${
          topCrypto[1] > 0
            ? `⇒ Top requested crypto: \`${topCrypto[0]}\` with \`${
                topCrypto[1]
              }%\` dominance.\n`
            : ''
        }${
          popCrypto[1] > 0
            ? `⇒ Top mentioned crypto: \`${popCrypto[0]}\` with \`${
                popCrypto[1]
              }%\` dominance.\n`
            : ''
        }⇒ Support or share Tsuki here: <https://discordbots.org/bot/tsuki>.\n` +
        '`⇒ ETH donations appreciated at: 0xd234168c142D2771cD96eA8d59b1f57304604533.`';

      const embed = new Discord.RichEmbed()
        .addField('TsukiBot Stats', msgh)
        .setColor('WHITE')
        .setThumbnail('https://imgur.com/7pLQHei.png')
        .setFooter('Part of CehhNet', 'https://imgur.com/OG77bXa.png');

      channel.send({ embed });

      // Meme
    } else if (scommand === '.dank') {
      channel.send(
        ':ok_hand:           :tiger:' +
          '\n' +
          ' :eggplant: :zzz: :necktie: :eggplant:' +
          '\n' +
          '                  :oil:     :nose:' +
          '\n' +
          '            :zap:  8=:punch: =D:sweat_drops:' +
          '\n' +
          '         :trumpet:   :eggplant:                       :sweat_drops:' +
          '\n' +
          '          :boot:    :boot:'
      );

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

  channel
    .send(
      '__**Commands**__\n\n' +
        ':regional_indicator_k: = Kraken\n\n' +
        ':regional_indicator_g: = GDAX\n\n' +
        ':regional_indicator_c: = CryptoCompare\n\n' +
        ':regional_indicator_p: = Poloniex\n\n' +
        ':regional_indicator_e: = Etherscan\n\n' +
        ':regional_indicator_b: = Bittrex\n\n' +
        ':moneybag: = Volume\n\n' +
        ':envelope: = Subscription Channels\n\n' +
        '`React to the according symbols below to disable a service. Save settings with the checkmark.`'
    )
    .then(msg => {
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
  if (
    removeID(messageReaction.message.id) != -1 &&
    messageReaction.emoji.identifier == '%E2%9D%8E' &&
    messageReaction.count == 2
  ) {
    messageReaction.message.delete().catch();
  }

  // Function 2a.
  if (
    configIDs.indexOf(message.id) > -1 &&
    reactions.size < emojiConfigs.length
  ) {
    message
      .react(
        emojiConfigs[emojiConfigs.indexOf(messageReaction.emoji.toString()) + 1]
      )
      .catch(console.log);
  }

  // Function 2b.
  if (
    configIDs.indexOf(message.id) > -1 &&
    reactions.size === emojiConfigs.length
  ) {
    // Finished placing options
    if (
      messageReaction.emoji.toString() === emojiConfigs[emojiConfigs.length - 1]
    ) {
      // Reacted to checkmark
      if (hasPermissions(user.id, message.guild)) {
        // User has permissions
        // Get from the reactions those which have reactions from someone with permissions
        const validPerms = reactions.filter(r =>
          r.users.some((e, i, a) => hasPermissions(e.id, message.guild))
        );

        // Get an array form of the permissions
        serverConfigs[guild] = validPerms.map(
          e => availableCommands[emojiConfigs.indexOf(e.emoji.toString())]
        );

        // Write to a file for storage
        fs.writeFile(
          'common/serverPerms.json',
          JSON.stringify(serverConfigs),
          err => {
            if (err) return console.log(err);
            console.log('Server config saved');
          }
        );

        // Delete the message
        message
          .delete()
          .then(() => {
            if (serverConfigs[guild].length > 1) {
              message.channel
                .send(
                  `**Settings updated**\nBlocked services: \`${serverConfigs[
                    guild
                  ]
                    .slice(0, -1)
                    .join(' ')}\`.`
                )
                .catch(console.log);
            }
          })
          .catch(console.log);
      }
    }
  }
});

function hasPermissions(id, guild) {
  return guild.owner.id === id;
}

// Error event logging
client.on('error', err => {
  console.log(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

client.login(token);
