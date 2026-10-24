const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { getStreamData, updateStreamData } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Manage streaming settings, schedule, roles, and creator shoutouts (Staff only).')
    // ── setlink ──
    .addSubcommand((sub) =>
      sub
        .setName('setlink')
        .setDescription('Save a default link for your stream or social media channel')
        .addStringOption((opt) =>
          opt
            .setName('platform')
            .setDescription('Platform to configure')
            .setRequired(true)
            .addChoices(
              { name: 'Twitch', value: 'twitch' },
              { name: 'Kick', value: 'kick' },
              { name: 'YouTube', value: 'youtube' },
              { name: 'TikTok', value: 'tiktok' },
              { name: 'Twitter / X', value: 'twitter' },
              { name: 'Instagram', value: 'instagram' },
              { name: 'Discord Invite', value: 'discord' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('url')
            .setDescription('Your profile or channel link (e.g. https://twitch.tv/username)')
            .setRequired(true)
        )
    )
    // ── setschedule ──
    .addSubcommand((sub) =>
      sub
        .setName('setschedule')
        .setDescription('Add or update a day on your weekly streaming schedule')
        .addStringOption((opt) =>
          opt
            .setName('day')
            .setDescription('Day of the week')
            .setRequired(true)
            .addChoices(
              { name: 'Monday', value: 'Monday' },
              { name: 'Tuesday', value: 'Tuesday' },
              { name: 'Wednesday', value: 'Wednesday' },
              { name: 'Thursday', value: 'Thursday' },
              { name: 'Friday', value: 'Friday' },
              { name: 'Saturday', value: 'Saturday' },
              { name: 'Sunday', value: 'Sunday' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('time')
            .setDescription('Start time and timezone (e.g. 7:00 PM EST / 6:00 PM CST)')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('game')
            .setDescription('Game or category planned for this day')
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('note')
            .setDescription('Extra note (e.g. Community games, Ranked grind, viewer customs)')
            .setRequired(false)
        )
    )
    // ── clearschedule ──
    .addSubcommand((sub) =>
      sub
        .setName('clearschedule')
        .setDescription('Clear all or specific day from your stream schedule')
        .addStringOption((opt) =>
          opt
            .setName('day')
            .setDescription('Specific day to clear (leave empty to clear whole schedule)')
            .setRequired(false)
            .addChoices(
              { name: 'All Days', value: 'all' },
              { name: 'Monday', value: 'Monday' },
              { name: 'Tuesday', value: 'Tuesday' },
              { name: 'Wednesday', value: 'Wednesday' },
              { name: 'Thursday', value: 'Thursday' },
              { name: 'Friday', value: 'Friday' },
              { name: 'Saturday', value: 'Saturday' },
              { name: 'Sunday', value: 'Sunday' }
            )
        )
    )
    // ── setrole ──
    .addSubcommand((sub) =>
      sub
        .setName('setrole')
        .setDescription('Set or automatically create the @Stream Ping notification role')
        .addRoleOption((opt) =>
          opt
            .setName('role')
            .setDescription('Role to use for stream alerts (leave empty to auto-create @Stream Alerts)')
            .setRequired(false)
        )
    )
    // ── shoutout ──
    .addSubcommand((sub) =>
      sub
        .setName('shoutout')
        .setDescription('Shout out a creator or raid target in chat with links and buttons')
        .addStringOption((opt) =>
          opt
            .setName('creator')
            .setDescription('Creator channel name')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('url')
            .setDescription('Link to their stream or profile')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('platform')
            .setDescription('Their platform')
            .setRequired(false)
            .addChoices(
              { name: 'Twitch', value: 'Twitch' },
              { name: 'Kick', value: 'Kick' },
              { name: 'YouTube', value: 'YouTube' },
              { name: 'TikTok', value: 'TikTok' },
              { name: 'Other', value: 'Other' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('game')
            .setDescription('Game they are playing or known for')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) {
      return denyPermission(interaction);
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const streamData = getStreamData(guildId);

    // ─────────────────────────────────────────────
    // SET LINK
    // ─────────────────────────────────────────────
    if (sub === 'setlink') {
      const platform = interaction.options.getString('platform');
      const url = interaction.options.getString('url');

      const socials = streamData.socials || {};
      socials[platform] = url;

      updateStreamData(guildId, { socials });

      return interaction.reply({
        content: `✅ Saved **${platform.toUpperCase()}** link to: <${url}>\nUse \`/socials\` to view your public creator card!`,
        ephemeral: true,
      });
    }

    // ─────────────────────────────────────────────
    // SET SCHEDULE
    // ─────────────────────────────────────────────
    if (sub === 'setschedule') {
      const day = interaction.options.getString('day');
      const time = interaction.options.getString('time');
      const game = interaction.options.getString('game') || 'Variety / Just Chatting';
      const note = interaction.options.getString('note') || '';

      let schedule = streamData.schedule || [];
      // Replace existing entry for this day or add
      schedule = schedule.filter((s) => s.day !== day);
      schedule.push({ day, time, game, note });

      // Sort by day of week
      const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      schedule.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));

      updateStreamData(guildId, { schedule });

      return interaction.reply({
        content: `✅ Updated **${day}** stream schedule: **${time}** playing **${game}**!\nCheck \`/schedule\` to preview.`,
        ephemeral: true,
      });
    }

    // ─────────────────────────────────────────────
    // CLEAR SCHEDULE
    // ─────────────────────────────────────────────
    if (sub === 'clearschedule') {
      const day = interaction.options.getString('day') || 'all';

      if (day === 'all') {
        updateStreamData(guildId, { schedule: [] });
        return interaction.reply({ content: '🗑️ Cleared all stream schedule entries.', ephemeral: true });
      }

      const schedule = (streamData.schedule || []).filter((s) => s.day !== day);
      updateStreamData(guildId, { schedule });
      return interaction.reply({ content: `🗑️ Removed **${day}** from the stream schedule.`, ephemeral: true });
    }

    // ─────────────────────────────────────────────
    // SET ROLE
    // ─────────────────────────────────────────────
    if (sub === 'setrole') {
      const role = interaction.options.getRole('role');

      if (role) {
        updateStreamData(guildId, { streamPingRoleId: role.id });
        return interaction.reply({
          content: `✅ Stream notification role set to <@&${role.id}>! Fans can use \`/streamping\` to toggle this role.`,
          ephemeral: true,
        });
      }

      // Automatically create the role
      try {
        const createdRole = await interaction.guild.roles.create({
          name: '🔔 Stream Alerts',
          color: '#9146FF',
          mentionable: true,
          reason: 'Created stream notification role for fans',
        });

        updateStreamData(guildId, { streamPingRoleId: createdRole.id });

        return interaction.reply({
          content: `🎉 Successfully created and configured <@&${createdRole.id}> for stream notifications! Members can use \`/streamping\` or click the notification button to get notified.`,
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({
          content: `❌ Failed to create role: ${err.message}. Please create a role manually and assign it using \`/stream setrole role:@YourRole\`.`,
          ephemeral: true,
        });
      }
    }

    // ─────────────────────────────────────────────
    // SHOUTOUT
    // ─────────────────────────────────────────────
    if (sub === 'shoutout') {
      const creator = interaction.options.getString('creator');
      const url = interaction.options.getString('url');
      const platform = interaction.options.getString('platform') || 'Twitch';
      const game = interaction.options.getString('game');

      const embed = new EmbedBuilder()
        .setTitle(`⚡ STREAMER SHOUTOUT: ${creator}`)
        .setURL(url)
        .setColor('#5865F2')
        .setDescription(
          `Go show some love and drop a follow for **${creator}**! Amazing creator and fellow streamer. Check out their stream! 💜`
        )
        .addFields(
          { name: '📺 Platform', value: `**${platform}**`, inline: true },
          { name: '🎮 Playing', value: game ? `\`${game}\`` : 'Awesome Games', inline: true }
        )
        .setFooter({ text: 'ZX Stream Community • Support Fellow Creators' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(`🚀 Visit ${creator} on ${platform}`)
          .setURL(url)
      );

      return interaction.reply({
        content: `🎉 **Massive Shoutout to ${creator}!**`,
        embeds: [embed],
        components: [row],
      });
    }
  },
};
