const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { getStreamData, updateStreamData } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

const PLATFORM_COLORS = {
  Twitch: '#9146FF',
  Kick: '#53FC18',
  YouTube: '#FF0000',
  TikTok: '#00F2FE',
  Other: config.color?.primary || '#5865F2',
};

const PLATFORM_EMOJIS = {
  Twitch: '🟣',
  Kick: '🟢',
  YouTube: '🔴',
  TikTok: '⬛',
  Other: '🎮',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('live')
    .setDescription('Announce going live on stream with interactive hype buttons (Staff only).')
    .addStringOption((opt) =>
      opt
        .setName('title')
        .setDescription('The title of your stream')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('game')
        .setDescription('Game or category (e.g. Valorant, Just Chatting, Minecraft)')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('platform')
        .setDescription('Streaming platform')
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
        .setName('url')
        .setDescription('Stream URL (leave empty to use your saved link from /stream setlink)')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('ping')
        .setDescription('Who to notify with this announcement')
        .setRequired(false)
        .addChoices(
          { name: '🔔 Stream Notification Role', value: 'role' },
          { name: '📢 @everyone', value: 'everyone' },
          { name: '👀 @here', value: 'here' },
          { name: '🚫 None', value: 'none' }
        )
    )
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel to post the live announcement (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) {
      return denyPermission(interaction);
    }

    const title = interaction.options.getString('title');
    const game = interaction.options.getString('game');
    const platform = interaction.options.getString('platform') || 'Twitch';
    let url = interaction.options.getString('url');
    const pingChoice = interaction.options.getString('ping') || 'role';
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const streamData = getStreamData(interaction.guild.id);

    // If no URL given, try fetching default from saved socials
    if (!url) {
      const platformKey = platform.toLowerCase();
      url = streamData.socials?.[platformKey];
    }

    if (!url) {
      return interaction.reply({
        content: `❌ No stream URL was provided, and no default **${platform}** link is saved. Use \`/stream setlink\` to save your link or provide one with the \`url:\` option.`,
        ephemeral: true,
      });
    }

    const streamId = Date.now().toString(36);
    const color = PLATFORM_COLORS[platform] || '#5865F2';
    const emoji = PLATFORM_EMOJIS[platform] || '🎮';

    // Build Ping Content
    let pingText = '';
    if (pingChoice === 'everyone') {
      pingText = '@everyone';
    } else if (pingChoice === 'here') {
      pingText = '@here';
    } else if (pingChoice === 'role') {
      if (streamData.streamPingRoleId) {
        pingText = `<@&${streamData.streamPingRoleId}>`;
      } else {
        pingText = '@here'; // Fallback if role is not set
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔴 LIVE NOW: ${title}`)
      .setURL(url)
      .setColor(color)
      .setDescription(
        `Hey everyone! **${interaction.member.displayName}** just went live on **${platform}**! Come hang out, chat, and support the stream! 🚀`
      )
      .addFields(
        { name: '🎮 Category / Game', value: `\`${game}\``, inline: true },
        { name: `${emoji} Platform`, value: `**${platform}**`, inline: true },
        { name: '👤 Streamer', value: `<@${interaction.user.id}>`, inline: true },
        { name: '👥 Fans Watching (0)', value: 'Be the first to click **I\'m Watching!** below 🙌', inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(interaction.guild.bannerURL({ size: 1024 }) || null)
      .setFooter({ text: 'ZX Stream Network • Click buttons below to join the hype' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(`🔴 Watch on ${platform}`)
        .setURL(url),
      new ButtonBuilder()
        .setCustomId(`stream_watch_${streamId}`)
        .setStyle(ButtonStyle.Success)
        .setLabel("I'm Watching! (0)")
        .setEmoji('🙌'),
      new ButtonBuilder()
        .setCustomId('stream_ping_toggle')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Get Stream Alerts')
        .setEmoji('🔔')
    );

    // Send announcement
    let sentMessage;
    if (targetChannel.id === interaction.channel.id) {
      await interaction.reply({
        content: pingText ? `${pingText} 🚀 **WE ARE LIVE!**` : '🚀 **WE ARE LIVE!**',
        embeds: [embed],
        components: [row],
      });
      sentMessage = await interaction.fetchReply();
    } else {
      sentMessage = await targetChannel.send({
        content: pingText ? `${pingText} 🚀 **WE ARE LIVE!**` : '🚀 **WE ARE LIVE!**',
        embeds: [embed],
        components: [row],
      });
      await interaction.reply({
        content: `✅ Stream announcement posted in <#${targetChannel.id}>!`,
        ephemeral: true,
      });
    }

    // Save active live session
    updateStreamData(interaction.guild.id, {
      currentLive: {
        streamId,
        messageId: sentMessage.id,
        channelId: targetChannel.id,
        title,
        game,
        platform,
        url,
        startedAt: new Date().toISOString(),
        watchers: [],
      },
    });
  },
};
