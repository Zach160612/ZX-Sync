const { Events } = require('discord.js');
const { logAction, buildLogEmbed } = require('../../utils/logger');
const config = require('../../../config.json');

module.exports = {
  name: Events.MessageDelete,

  async execute(message, client) {
    // Ignore DMs, bots, uncached messages, and the log channel itself
    if (!message.guild) return;
    if (message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;
    if (message.channel.id === config.channels?.log) return;

    const content = message.content || '*No text content*';
    const truncated = content.length > 1024 ? content.slice(0, 1021) + '...' : content;

    await logAction(
      client,
      buildLogEmbed({
        title: '🗑️ Message Deleted',
        color: config.color.error,
        description: `A message was deleted in ${message.channel}.`,
        fields: [
          { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: true },
          { name: 'Channel', value: `${message.channel}`, inline: true },
          { name: 'Content', value: truncated, inline: false },
        ],
        thumbnail: message.author?.displayAvatarURL({ dynamic: true }) || null,
      })
    );
  },
};
