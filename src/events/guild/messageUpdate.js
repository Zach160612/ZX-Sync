const { Events } = require('discord.js');
const { logAction, buildLogEmbed } = require('../../utils/logger');
const config = require('../../../config.json');

module.exports = {
  name: Events.MessageUpdate,

  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Embed load, no real edit
    if (newMessage.channel.id === config.channels?.log) return;

    const oldContent = oldMessage.content || '*Not cached*';
    const newContent = newMessage.content || '*No content*';

    const truncate = (str) => (str.length > 500 ? str.slice(0, 497) + '...' : str);

    await logAction(
      client,
      buildLogEmbed({
        title: '✏️ Message Edited',
        color: config.color.warning,
        description: `A message was edited in ${newMessage.channel}. [Jump to message](${newMessage.url})`,
        fields: [
          { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
          { name: 'Channel', value: `${newMessage.channel}`, inline: true },
          { name: 'Before', value: truncate(oldContent), inline: false },
          { name: 'After', value: truncate(newContent), inline: false },
        ],
        thumbnail: newMessage.author.displayAvatarURL({ dynamic: true }),
      })
    );
  },
};
