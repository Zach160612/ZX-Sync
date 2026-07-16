const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

/**
 * Build a success embed.
 * @param {string} description
 * @param {string} [title]
 */
function successEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(config.color.success)
    .setDescription(`✅ ${description}`)
    .setTimestamp();
  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Build an error embed.
 * @param {string} description
 * @param {string} [title]
 */
function errorEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(config.color.error)
    .setDescription(`❌ ${description}`)
    .setTimestamp();
  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Build an info/primary embed.
 * @param {string} description
 * @param {string} [title]
 */
function infoEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(config.color.primary)
    .setDescription(description)
    .setTimestamp();
  if (title) embed.setTitle(title);
  return embed;
}

/**
 * Build a warning embed.
 * @param {string} description
 * @param {string} [title]
 */
function warningEmbed(description, title = null) {
  const embed = new EmbedBuilder()
    .setColor(config.color.warning)
    .setDescription(`⚠️ ${description}`)
    .setTimestamp();
  if (title) embed.setTitle(title);
  return embed;
}

module.exports = { successEmbed, errorEmbed, infoEmbed, warningEmbed };
