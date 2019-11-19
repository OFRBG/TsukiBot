const schedule = require('node-schedule');
const reloader = require('./getCoins');
const logger = require('./logger');

const extensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'mov', 'mp4'];

const updateCoins = async () => {
  const [pairs, filtered] = await reloader.update();
};

const getCMCData = async () => {
  cmcArray = await clientcmc.ticker({ limit: 0 });

  cmcArrayDict = {};
  cmcArray.forEach(v => {
    if (!cmcArrayDict[v.symbol]) cmcArrayDict[v.symbol] = v;
  });
};

const startup = client => {
  logger.info('------------------ Bot start ------------------');

  client.user.setActivity('.tbhelp');

  schedule.scheduleJob('*/1 * * * *', getCMCData);
  schedule.scheduleJob('* * 12 * *', updateCoins);

  client
    .fetchUser('217327366102319106')
    .then(u => u.send('TsukiBot loaded.'))
    .catch(err => logger.error(err));
};

const newGuild = guild => {
  if (guild.defaultChannel)
    guild.defaultChannel.send(
      'ありがとう! Get a list of commands with `.tbhelp`.'
    );

  guild
    .createRole({ name: 'File Perms', color: 'BLUE' })
    .then(role =>
      guild.defaultChannel
        ? guild.defaultChannel.send(
            `Created role ${role} for users who should be allowed to send files!`
          )
        : ''
    )
    .catch(console.error);
};

const newMessage = message => {
  if (process.argv[2] === '-d' && message.author.id !== '217327366102319106')
    return null;

  if (message.author == null) return null;

  if (message.guild && !message.guild.roles.exists('name', 'File Perms')) {
    message.guild
      .createRole({ name: 'File Perms', color: 'BLUE' })
      .then(role =>
        message.channel.send(
          `Created role ${role} for users who should be allowed to send files!`
        )
      )
      .catch(console.error);
  }

  if (message.member && !message.member.roles.exists('name', 'File Perms')) {
    message.attachments.forEach(attachment =>
      extensions.indexOf(
        (ar => ar[ar.length - 1])(
          attachment[1].filename.split('.')
        ).toLowerCase()
      ) === -1
        ? message
            .delete()
            .then(msg => console.log(`Deleted message from ${msg.author}`))
            .catch(console.error)
        : ''
    );
  }

  if (message.channel.type !== 'text') return null;

  return message;
};

module.exports = { startup, newGuild, newMessage };
