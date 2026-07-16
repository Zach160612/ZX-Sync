const config = require('../../config.json');

/**
 * Check if a GuildMember has staff-level access.
 * Grants access if the member:
 *   1. Is the server owner
 *   2. Has the Administrator Discord permission
 *   3. Has one of the configured staff roles by name
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function hasPermission(member) {
  if (!member || !member.guild) return false;

  // Server owner always has full access
  if (member.guild.ownerId === member.id) return true;

  // Discord Administrator permission
  const { PermissionFlagsBits } = require('discord.js');
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  // Configured staff roles
  const staffRoles = config.staffRoles || [];
  return member.roles.cache.some((role) => staffRoles.includes(role.name));
}

/**
 * Reply with a permission-denied ephemeral message.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function denyPermission(interaction) {
  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setColor(config.color.error)
    .setDescription('❌ You don\'t have permission to use this command.');

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = { hasPermission, denyPermission };
