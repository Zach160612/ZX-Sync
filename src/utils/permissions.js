const config = require('../../config.json');
const { getUserLevel } = require('./levelSystem.js');

const LEVELS = {
  1: { name: 'Owner', color: '#FFD700', emoji: '👑' },
  2: { name: 'Admin', color: '#ED4245', emoji: '🛡️' },
  3: { name: 'Moderator', color: '#5865F2', emoji: '⚔️' },
  4: { name: 'Member', color: '#57F287', emoji: '👤' }
};

/**
 * Check if a GuildMember has staff-level access.
 * Grants access if the member:
 *   1. Is the server owner (ALWAYS has access)
 *   2. Has level 1-3 (Owner, Admin, Moderator) in the level system
 *   3. Has the Administrator Discord permission
 *   4. Has one of the configured staff roles by name
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function hasPermission(member) {
  if (!member || !member.guild) {
    return false;
  }

  // Server owner ALWAYS has full access - this is the highest priority
  if (member.guild.ownerId === member.id) {
    console.log(`[Permissions] ${member.user.tag} is server owner - GRANTED`);
    return true;
  }

  // Check level system FIRST (Owner, Admin, Moderator only - not Member)
  const userLevel = getUserLevel(member);
  console.log(`[Permissions] ${member.user.tag} has level ${userLevel}`);
  
  if (userLevel <= 3) {
    console.log(`[Permissions] ${member.user.tag} has staff level - GRANTED`);
    return true;
  }

  // If level is 4 (Member), deny access regardless of Discord permissions
  if (userLevel === 4) {
    console.log(`[Permissions] ${member.user.tag} is Member level - DENIED`);
    return false;
  }

  // Fallback to Discord permissions for users without level assigned
  const { PermissionFlagsBits } = require('discord.js');
  
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log(`[Permissions] ${member.user.tag} has Administrator - GRANTED`);
    return true;
  }

  // Configured staff roles (matched by role name or role ID)
  const staffRoles = config.staffRoles || [];
  if (member.roles.cache.some((role) => staffRoles.includes(role.name) || staffRoles.includes(role.id))) {
    console.log(`[Permissions] ${member.user.tag} has staff role - GRANTED`);
    return true;
  }

  console.log(`[Permissions] ${member.user.tag} - DENIED`);
  return false;
}

/**
 * Reply with a permission-denied ephemeral message.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function denyPermission(interaction) {
  const { EmbedBuilder } = require('discord.js');
  
  const member = interaction.member;
  const userLevel = getUserLevel(member);
  const levelInfo = LEVELS[userLevel] || LEVELS[4];
  
  const embed = new EmbedBuilder()
    .setColor(config.color.error)
    .setTitle('❌ Permission Denied')
    .setDescription(`This command is restricted to **Owner, Admin, and Moderator** only.`)
    .addFields(
      { name: 'Your Level', value: `${levelInfo.emoji} ${levelInfo.name} (Level ${userLevel})`, inline: true },
      { name: 'Required', value: '👑 Owner / 🛡️ Admin / ⚔️ Moderator', inline: true }
    );

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = { hasPermission, denyPermission };
