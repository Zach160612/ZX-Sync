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

const TYPE_COLORS = {
  JOIN: '#57F287',    // Green
  LEAVE: '#FEE75C',   // Yellow
  KICK: '#ED4245',    // Red
  BAN: '#ED4245',     // Red
  WARN: '#FFA500',    // Orange
  TIMEOUT: '#99AAB5', // Grey
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
        .addUserOption((o) =>
          o.setName('user').setDescription('Filter by @mentioning a member').setRequired(false)
        )
        .addStringOption((o) =>
          o
            .setName('userid')
            .setDescription('Search all history by Discord User ID (e.g. 123456789012345678)')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Clear all activity logs (Server Owner / Admin only).')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();

    // ── CLEAR ──────────────────────────────────────────────────
    if (sub === 'clear') {
      clearActivities();
      return interaction.reply({
        embeds: [successEmbed('✅ Server activity logs have been cleared.')],
        ephemeral: true,
      });
    }

    // ── LIST ───────────────────────────────────────────────────
    if (sub === 'list') {
      const typeFilter  = interaction.options.getString('type');
      const targetUser  = interaction.options.getUser('user');
      const rawUserId   = interaction.options.getString('userid')?.trim();

      // Determine the user ID to filter by (raw ID takes priority over @mention)
      const filterUserId = rawUserId || (targetUser ? targetUser.id : null);

      // When searching by user ID → no type filter, no limit cap, show everything
      const isUserSearch = Boolean(filterUserId);

      const logs = getActivities({
        limit: isUserSearch ? 500 : 20,    // show everything for a user search
        type: isUserSearch ? null : typeFilter, // ignore type filter when searching by user
        userId: filterUserId,
      });

      // ── No results ─────────────────────────────────────────────
      if (!logs || logs.length === 0) {
        const notFoundEmbed = new EmbedBuilder()
          .setColor(config.color.info || '#5865F2')
          .setTitle('📋 Activity Logs')
          .setDescription(
            filterUserId
              ? `No activity records found for user ID \`${filterUserId}\`.`
              : 'No matching activity logs found.'
          )
          .setTimestamp();

        return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
      }

      // ── Build results ──────────────────────────────────────────
      // Group entries by type for user ID searches so it's easy to read
      const logLines = logs.map((item) => {
        const icon          = TYPE_ICONS[item.type] || '📌';
        const ts            = Math.floor(item.timestamp / 1000);
        const timeFormatted = `<t:${ts}:F> (<t:${ts}:R>)`;
        const userStr       = item.user ? `**${item.user.tag}** (\`${item.user.id}\`)` : 'Unknown User';
        const modStr        = item.moderator ? ` · by **${item.moderator.tag}**` : '';
        const reasonStr     = item.reason   ? `\n  └ Reason: *${item.reason}*`   : '';
        const detailsStr    = item.details  ? ` *(${item.details})*`             : '';

        return `${icon} **${item.type}** — ${userStr} · ${timeFormatted}${detailsStr}${modStr}${reasonStr}`;
      });

      // Split into pages of 10 if large
      const PAGE_SIZE = 10;
      const page = logLines.slice(0, PAGE_SIZE);
      const remaining = logLines.length - PAGE_SIZE;

      const embedColor = isUserSearch
        ? (config.color.primary || '#5865F2')
        : (TYPE_COLORS[typeFilter] || config.color.primary || '#5865F2');

      const embed = new EmbedBuilder()
        .setTitle('📋 Server Activity Logs')
        .setColor(embedColor)
        .setDescription(page.join('\n\n'))
        .setTimestamp();

      // Footer with totals
      const footerParts = [`Showing ${Math.min(logs.length, PAGE_SIZE)} of ${logs.length} event(s)`];
      if (remaining > 0) footerParts.push(`(+${remaining} more — use type filter to narrow down)`);
      embed.setFooter({ text: footerParts.join(' ') });

      // If searching by user, show summary breakdown in fields
      if (isUserSearch) {
        const counts = {};
        for (const item of logs) {
          counts[item.type] = (counts[item.type] || 0) + 1;
        }
        const summaryLines = Object.entries(counts)
          .map(([type, count]) => `${TYPE_ICONS[type] || '📌'} **${type}**: ${count}`)
          .join('\n');

        embed.setTitle(`📋 Full History`);

        // Try to show the username from the first log entry
        const firstEntry = logs[0];
        const displayName = firstEntry?.user?.tag || rawUserId || targetUser?.tag || 'Unknown User';
        embed.setAuthor({ name: `User: ${displayName}` });
        embed.addFields({ name: '📊 Summary', value: summaryLines, inline: false });
      } else if (targetUser) {
        embed.setAuthor({
          name: `User: ${targetUser.tag}`,
          iconURL: targetUser.displayAvatarURL({ dynamic: true }),
        });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
