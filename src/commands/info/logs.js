const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { getActivities, clearActivities } = require(path.join(__dirname, '..', '..', 'utils', 'activityLogger.js'));
const config = require('../../../config.json');

const TYPE_ICONS = {
  JOIN: '📥',
  LEAVE: '🚪',
  KICK: '👢',
  BAN: '🔨',
  WARN: '⚠️',
  TIMEOUT: '🔇',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('View server member activity logs (Joins, Leaves, Kicks, Bans, Warns).')
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List recent member activity events.')
        .addStringOption((o) =>
          o
            .setName('type')
            .setDescription('Filter by event type')
            .setRequired(false)
            .addChoices(
              { name: '📥 Joins', value: 'JOIN' },
              { name: '🚪 Leaves', value: 'LEAVE' },
              { name: '👢 Kicks', value: 'KICK' },
              { name: '🔨 Bans', value: 'BAN' },
              { name: '⚠️ Warns', value: 'WARN' },
              { name: '🔇 Timeouts', value: 'TIMEOUT' }
            )
        )
        .addUserOption((o) => o.setName('user').setDescription('Filter by specific member').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Clear all activity logs (Server Owner / Admin only).')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();

    if (sub === 'clear') {
      clearActivities();
      return interaction.reply({
        embeds: [successEmbed('Server activity logs have been cleared.')],
        ephemeral: true,
      });
    }

    if (sub === 'list') {
      const typeFilter = interaction.options.getString('type');
      const targetUser = interaction.options.getUser('user');

      const logs = getActivities({
        limit: 15,
        type: typeFilter,
        userId: targetUser ? targetUser.id : null,
      });

      if (!logs || logs.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.color.info || '#5865F2')
              .setTitle('📋 Activity Logs')
              .setDescription('No matching activity logs found.')
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

      const logLines = logs.map((item) => {
        const icon = TYPE_ICONS[item.type] || '📌';
        const timeFormatted = `<t:${Math.floor(item.timestamp / 1000)}:R>`;
        const userStr = item.user ? `**${item.user.tag}**` : 'Unknown User';
        const modStr = item.moderator ? ` (by ${item.moderator.tag})` : '';
        const reasonStr = item.reason ? ` — *Reason:* ${item.reason}` : '';
        const detailsStr = item.details ? ` (${item.details})` : '';

        return `${icon} **[${item.type}]** ${userStr}${modStr} • ${timeFormatted}${detailsStr}${reasonStr}`;
      });

      const embed = new EmbedBuilder()
        .setTitle('📋 Server Member Activity Logs')
        .setColor(config.color.primary || '#5865F2')
        .setDescription(logLines.join('\n\n'))
        .setFooter({ text: `Showing last ${logs.length} activity event(s)` })
        .setTimestamp();

      if (targetUser) {
        embed.setAuthor({ name: `Target: ${targetUser.tag}`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
