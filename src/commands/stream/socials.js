const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const path = require('path');
const { getStreamData } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

const PLATFORM_CONFIG = {
  twitch: { name: 'Twitch', emoji: '🟣', label: 'Watch on Twitch' },
  kick: { name: 'Kick', emoji: '🟢', label: 'Watch on Kick' },
  youtube: { name: 'YouTube', emoji: '🔴', label: 'Subscribe on YouTube' },
  tiktok: { name: 'TikTok', emoji: '⬛', label: 'Follow on TikTok' },
  twitter: { name: 'Twitter / X', emoji: '🐦', label: 'Follow on X' },
  instagram: { name: 'Instagram', emoji: '📸', label: 'Follow on Instagram' },
  discord: { name: 'Discord', emoji: '💬', label: 'Join Discord' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('socials')
    .setDescription('View the streamer\'s social media channels and stream links.'),

  async execute(interaction) {
    const streamData = getStreamData(interaction.guild.id);
    const socials = streamData.socials || {};

    const activeLinks = Object.entries(socials).filter(([_, url]) => url && url.trim().length > 0);

    const embed = new EmbedBuilder()
      .setTitle(`🌟 ${interaction.guild.name} — Creator Socials & Channels`)
      .setColor(config.color?.primary || '#5865F2')
      .setDescription(
        'Make sure to drop a follow and subscribe across all channels to stay connected, watch streams, and never miss content! 🚀'
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || interaction.client.user.displayAvatarURL())
      .setFooter({ text: 'ZX Sync Stream Network' })
      .setTimestamp();

    if (activeLinks.length === 0) {
      embed.addFields({
        name: '📺 Social Channels',
        value: 'No social channels have been configured yet! Staff can configure links using `/stream setlink`.',
      });
      return interaction.reply({ embeds: [embed] });
    }

    const fields = activeLinks.map(([key, url]) => {
      const cfg = PLATFORM_CONFIG[key] || { name: key, emoji: '🔗' };
      return `${cfg.emoji} **${cfg.name}**: [Click Here to Visit](${url})`;
    });

    embed.addFields({
      name: '🌐 Channels & Links',
      value: fields.join('\n\n'),
    });

    // Build buttons row (Discord max 5 buttons per action row)
    const buttonRows = [];
    let currentRow = new ActionRowBuilder();

    for (const [key, url] of activeLinks) {
      if (currentRow.components.length >= 5) {
        buttonRows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
      const cfg = PLATFORM_CONFIG[key] || { label: key };
      currentRow.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(cfg.label)
          .setURL(url)
      );
    }
    if (currentRow.components.length > 0) {
      buttonRows.push(currentRow);
    }

    // Add Stream Ping toggle button row
    const pingRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('stream_ping_toggle')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('🔔 Get Stream Alerts Role')
    );
    buttonRows.push(pingRow);

    return interaction.reply({
      embeds: [embed],
      components: buttonRows.slice(0, 5), // Discord max 5 rows
    });
  },
};
