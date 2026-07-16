const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

/**
 * Send a log embed to the configured log channel.
 * @param {import('discord.js').Client} client
 * @param {EmbedBuilder} embed
 */
async function logAction(client, embed) {
  try {
    const logChannelId = config.channels?.log;
    if (!logChannelId || logChannelId === 'LOG_CHANNEL_ID_HERE') return;

    const channel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[Logger] Failed to send log:', err.message);
  }
}

/**
 * Build a standard log embed.
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.color
 * @param {string} options.description
 * @param {Array<{name: string, value: string, inline?: boolean}>} [options.fields]
 * @param {string} [options.thumbnail]
 * @returns {EmbedBuilder}
 */
function buildLogEmbed({ title, color, description, fields = [], thumbnail = null }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(description)
    .setTimestamp();

  if (fields.length > 0) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);

  return embed;
}

module.exports = { logAction, buildLogEmbed };
