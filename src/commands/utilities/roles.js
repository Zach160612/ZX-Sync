const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

/**
 * Filter out staff, admin, mod, bot, and clanker roles.
 * Returns only normal community/gaming/cosmetic roles.
 * @param {import('discord.js').Guild} guild
 */
function getNormalRoles(guild) {
  const staffRoleNames = (config.staffRoles || []).map((r) => r.toLowerCase());
  const restrictedKeywords = [
    'admin', 'owner', 'mod', 'staff', 'clanker', 'bot', 'system',
    'big booty', 'stripper', 'german', 'saxon', 'the goat', 'welsh', 'custom'
  ];

  return guild.roles.cache
    .filter((role) => {
      // 1. Exclude @everyone
      if (role.id === guild.id) return false;

      // 2. Exclude bot/managed roles
      if (role.managed) return false;

      const lowerName = role.name.toLowerCase();

      // 3. Exclude explicitly configured staff roles
      if (staffRoleNames.includes(lowerName) || (config.staffRoles || []).includes(role.id)) {
        return false;
      }

      // 4. Exclude roles matching restricted keywords
      if (restrictedKeywords.some((keyword) => lowerName.includes(keyword))) {
        return false;
      }

      // 5. Exclude custom created roles (flagged or starting with ⭐ or ✨)
      if (lowerName.includes('custom') || role.name.includes('⭐') || role.name.includes('✨')) {
        return false;
      }

      // 5. Exclude roles with moderation/admin permissions
      const perms = role.permissions;
      if (
        perms.has(PermissionFlagsBits.Administrator) ||
        perms.has(PermissionFlagsBits.ManageGuild) ||
        perms.has(PermissionFlagsBits.BanMembers) ||
        perms.has(PermissionFlagsBits.KickMembers) ||
        perms.has(PermissionFlagsBits.ManageRoles) ||
        perms.has(PermissionFlagsBits.ManageChannels) ||
        perms.has(PermissionFlagsBits.ManageMessages) ||
        perms.has(PermissionFlagsBits.ModerateMembers)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.position - a.position);
}

/**
 * Build the StringSelectMenu ActionRow for self-roles.
 */
function buildRoleSelectMenu(guild) {
  const normalRoles = getNormalRoles(guild);

  if (normalRoles.size === 0) return null;

  // Select menu supports max 25 options per menu
  const options = normalRoles.first(25).map((role) => ({
    label: role.name,
    value: role.id,
    description: `Click to get or remove the ${role.name} role`,
    emoji: '🎭',
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('self_role_select')
    .setPlaceholder('📜 Scroll and select a role to claim...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(selectMenu);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Self-role selection menu for normal community roles.')
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('Post the interactive self-role selection panel in this channel (Staff only).')
    )
    .addSubcommand((sub) =>
      sub
        .setName('get')
        .setDescription('Open the self-role selection menu for yourself.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const row = buildRoleSelectMenu(interaction.guild);

    if (!row) {
      return interaction.reply({
        embeds: [errorEmbed('No normal self-assignable roles were found in this server.')],
        ephemeral: true,
      });
    }

    if (sub === 'panel') {
      if (!hasPermission(interaction.member)) return denyPermission(interaction);

      const panelEmbed = new EmbedBuilder()
        .setTitle('🎭 Choose Your Roles')
        .setColor(config.color.primary || '#5865F2')
        .setDescription(
          'Scroll through the dropdown menu below and select any role you want!\n\n' +
          '• **Select a role** to assign it to yourself.\n' +
          '• **Select it again** if you want to remove it.\n\n' +
          '*Note: Admin, Staff, and Moderator roles are excluded for security.*'
        )
        .setFooter({ text: 'ZX Sync Role Manager' })
        .setTimestamp();

      await interaction.channel.send({ embeds: [panelEmbed], components: [row] });

      return interaction.reply({
        content: '✅ Self-role panel has been posted in this channel!',
        ephemeral: true,
      });
    }

    if (sub === 'get') {
      const getEmbed = new EmbedBuilder()
        .setTitle('🎭 Pick a Role')
        .setColor(config.color.primary || '#5865F2')
        .setDescription('Select a role from the dropdown menu below to add it to your profile!')
        .setTimestamp();

      return interaction.reply({
        embeds: [getEmbed],
        components: [row],
        ephemeral: true,
      });
    }
  },

  getNormalRoles,
  buildRoleSelectMenu,
};
