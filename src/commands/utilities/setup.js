const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const path = require('path');
const fs = require('fs');

const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

/**
 * Builds the setup status embed.
 */
function buildStatusEmbed(guild) {
  const welcomeCh = config.channels?.welcome ? `<#${config.channels.welcome}>` : '❌ Not set';
  const goodbyeCh = config.channels?.goodbye ? `<#${config.channels.goodbye}>` : '❌ Not set';
  const logCh = config.channels?.log ? `<#${config.channels.log}>` : '❌ Not set';

  const welcomeType = config.welcomeType === 'image' ? '🎨 Image Card' : '📝 Text Embed';
  const goodbyeType = config.goodbyeType === 'image' ? '🎨 Image Card' : '📝 Text Embed';

  const welcomeMsg = config.welcomeMessage || `Welcome to **{server}**, {user}! 🚀 We're glad you're here.`;
  const goodbyeMsg = config.goodbyeMessage || `**{user}** has left {server}. We wish you all the best in your tech journey! 👋`;

  const autoRolesList = Array.isArray(config.autoRoles) && config.autoRoles.length > 0
    ? config.autoRoles.map((rId) => `<@&${rId}>`).join(', ')
    : (config.autoRole ? `<@&${config.autoRole}>` : 'None');

  const ticketRole = config.ticketSupportRole ? `<@&${config.ticketSupportRole}>` : 'Not set';

  const lockChannelsList = Array.isArray(config.lockChannels) && config.lockChannels.length > 0
    ? config.lockChannels.map((cId) => `<#${cId}>`).join(', ')
    : 'None';

  return new EmbedBuilder()
    .setTitle('⚡ Tech Server Setup Status')
    .setColor(config.color?.primary || '#5865F2')
    .setDescription('Here is the current configuration for your server. Use `/setup` with options or the interactive buttons below to update settings.')
    .addFields(
      { name: '👋 Welcome Channel', value: welcomeCh, inline: true },
      { name: '🎨 Welcome Format', value: welcomeType, inline: true },
      { name: '💬 Welcome Message', value: `\`${welcomeMsg}\``, inline: false },
      { name: '🚪 Goodbye Channel', value: goodbyeCh, inline: true },
      { name: '🎨 Goodbye Format', value: goodbyeType, inline: true },
      { name: '💬 Goodbye Message', value: `\`${goodbyeMsg}\``, inline: false },
      { name: '📋 Audit Log Channel', value: logCh, inline: true },
      { name: '🛡️ Member Auto-Roles', value: autoRolesList, inline: true },
      { name: '🎫 Ticket Support Role', value: ticketRole, inline: true },
      { name: '🔒 Lock Channels', value: lockChannelsList, inline: false }
    )
    .setFooter({ text: 'ZX Sync Tech Bot Setup' })
    .setTimestamp();
}

/**
 * Saves updated configuration to config.json
 */
function saveConfig(updatedConfig) {
  const configPath = path.join(__dirname, '..', '..', '..', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Complete setup wizard for welcome/goodbye messages, channels, image cards, and roles.')
    .addChannelOption((o) =>
      o
        .setName('welcome_channel')
        .setDescription('The text channel for welcome messages')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('welcome_message')
        .setDescription('Custom welcome message (supports {user}, {username}, {server}, {memberCount})')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('welcome_type')
        .setDescription('Welcome message format type')
        .setRequired(false)
        .addChoices(
          { name: '🎨 Image Banner Card', value: 'image' },
          { name: '📝 Text Embed', value: 'text' }
        )
    )
    .addChannelOption((o) =>
      o
        .setName('goodbye_channel')
        .setDescription('The text channel for goodbye messages')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('goodbye_message')
        .setDescription('Custom goodbye message (supports {user}, {username}, {server}, {memberCount})')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('goodbye_type')
        .setDescription('Goodbye message format type')
        .setRequired(false)
        .addChoices(
          { name: '🎨 Image Banner Card', value: 'image' },
          { name: '📝 Text Embed', value: 'text' }
        )
    )
    .addChannelOption((o) =>
      o
        .setName('log_channel')
        .setDescription('The text channel for audit logs (joins, leaves, moderation)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addRoleOption((o) =>
      o
        .setName('autorole')
        .setDescription('Auto-role assigned to new tech members on join')
        .setRequired(false)
    )
    .addRoleOption((o) =>
      o
        .setName('ticket_role')
        .setDescription('Support staff role for member help tickets')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('preset')
        .setDescription('Apply recommended tech company default settings')
        .setRequired(false)
        .addChoices(
          { name: '🚀 Tech Company Recommended Setup', value: 'tech_company' }
        )
    )
    .addStringOption((o) =>
      o
        .setName('lock_channels')
        .setDescription('Select channels to lock (comma-separated channel IDs or names)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const welcomeChannel = interaction.options.getChannel('welcome_channel');
    const welcomeMsg = interaction.options.getString('welcome_message');
    const welcomeType = interaction.options.getString('welcome_type');
    const goodbyeChannel = interaction.options.getChannel('goodbye_channel');
    const goodbyeMsg = interaction.options.getString('goodbye_message');
    const goodbyeType = interaction.options.getString('goodbye_type');
    const logChannel = interaction.options.getChannel('log_channel');
    const autoRole = interaction.options.getRole('autorole');
    const ticketRole = interaction.options.getRole('ticket_role');
    const preset = interaction.options.getString('preset');
    const lockChannels = interaction.options.getString('lock_channels');

    const hasOptions =
      welcomeChannel ||
      welcomeMsg ||
      welcomeType ||
      goodbyeChannel ||
      goodbyeMsg ||
      goodbyeType ||
      logChannel ||
      autoRole ||
      ticketRole ||
      preset ||
      lockChannels;

    if (!config.channels) config.channels = {};

    // ── 1. If options provided or Preset selected ──
    if (hasOptions) {
      const changes = [];

      // Apply Tech Company Preset
      if (preset === 'tech_company') {
        config.welcomeEnabled = true;
        config.welcomeType = 'image';
        config.welcomeMessage = `Welcome to **{server}**, {user}! 🚀 Excited to have you in our tech workspace. Check out the channels and enjoy!`;
        
        config.goodbyeEnabled = true;
        config.goodbyeType = 'image';
        config.goodbyeMessage = `**{user}** left **{server}**. We wish you all the best in your tech & coding journey! 💻👋`;

        // Auto-discover channels if not already set
        const guildChannels = interaction.guild.channels.cache;
        const autoWelcome = guildChannels.find(
          (c) => c.isTextBased() && (c.name.includes('welcome') || c.name.includes('general'))
        );
        const autoGoodbye = guildChannels.find(
          (c) => c.isTextBased() && (c.name.includes('goodbye') || c.name.includes('welcome') || c.name.includes('general'))
        );
        const autoLog = guildChannels.find(
          (c) => c.isTextBased() && (c.name.includes('log') || c.name.includes('audit'))
        );

        if (autoWelcome) config.channels.welcome = autoWelcome.id;
        if (autoGoodbye) config.channels.goodbye = autoGoodbye.id;
        if (autoLog) config.channels.log = autoLog.id;

        changes.push('Applied **🚀 Tech Company Recommended Setup**!');
      }

      if (welcomeChannel) {
        config.channels.welcome = welcomeChannel.id;
        changes.push(`Welcome Channel: ${welcomeChannel}`);
      }
      if (welcomeMsg) {
        config.welcomeMessage = welcomeMsg;
        changes.push(`Welcome Message: "${welcomeMsg}"`);
      }
      if (welcomeType) {
        config.welcomeType = welcomeType;
        changes.push(`Welcome Format: **${welcomeType === 'image' ? '🎨 Image Card' : '📝 Text Embed'}**`);
      }
      if (goodbyeChannel) {
        config.channels.goodbye = goodbyeChannel.id;
        changes.push(`Goodbye Channel: ${goodbyeChannel}`);
      }
      if (goodbyeMsg) {
        config.goodbyeMessage = goodbyeMsg;
        changes.push(`Goodbye Message: "${goodbyeMsg}"`);
      }
      if (goodbyeType) {
        config.goodbyeType = goodbyeType;
        changes.push(`Goodbye Format: **${goodbyeType === 'image' ? '🎨 Image Card' : '📝 Text Embed'}**`);
      }
      if (logChannel) {
        config.channels.log = logChannel.id;
        changes.push(`Audit Log Channel: ${logChannel}`);
      }
      if (autoRole) {
        if (!Array.isArray(config.autoRoles)) config.autoRoles = [];
        if (!config.autoRoles.includes(autoRole.id)) {
          config.autoRoles.push(autoRole.id);
        }
        config.autoRole = autoRole.id;
        changes.push(`Auto-Role Added: ${autoRole}`);
      }
      if (ticketRole) {
        config.ticketSupportRole = ticketRole.id;
        changes.push(`Ticket Support Role: ${ticketRole}`);
      }
      if (lockChannels) {
        if (!config.lockChannels) config.lockChannels = [];
        const channelIds = lockChannels.split(',').map(id => id.trim());
        
        for (const channelId of channelIds) {
          let channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
            channel = interaction.guild.channels.cache.find(ch => ch.name.toLowerCase() === channelId.toLowerCase());
          }
          
          if (channel && !config.lockChannels.includes(channel.id)) {
            config.lockChannels.push(channel.id);
            changes.push(`Lock Channel Added: ${channel.name}`);
          }
        }
      }

      saveConfig(config);

      const responseEmbed = successEmbed(
        `✅ **Setup Options Updated Successfully!**\n\n${changes.join('\n')}`
      );

      await interaction.reply({ embeds: [responseEmbed, buildStatusEmbed(interaction.guild)] });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '⚙️ Bot Setup Configured',
          color: config.color?.success || '#57F287',
          description: `Setup updated by **${interaction.user.tag}**.`,
          fields: [{ name: 'Changes Applied', value: changes.join('\n'), inline: false }],
        })
      );
      return;
    }

    // ── 2. Interactive Wizard Dashboard (No options specified) ──
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_preset_tech')
        .setLabel('🚀 Apply Tech Preset')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('setup_toggle_welcome_img')
        .setLabel('🎨 Toggle Welcome Image')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_toggle_goodbye_img')
        .setLabel('🎨 Toggle Goodbye Image')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_refresh')
        .setLabel('🔄 Refresh Status')
        .setStyle(ButtonStyle.Secondary)
    );

    const reply = await interaction.reply({
      embeds: [buildStatusEmbed(interaction.guild)],
      components: [row],
      ephemeral: true,
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Only the command user can interact with this setup menu.', ephemeral: true });
      }

      if (i.customId === 'setup_preset_tech') {
        config.welcomeEnabled = true;
        config.welcomeType = 'image';
        config.welcomeMessage = `Welcome to **{server}**, {user}! 🚀 Excited to have you in our tech workspace. Check out the channels and enjoy!`;

        config.goodbyeEnabled = true;
        config.goodbyeType = 'image';
        config.goodbyeMessage = `**{user}** left **{server}**. We wish you all the best in your tech & coding journey! 💻👋`;

        const guildChannels = interaction.guild.channels.cache;
        const autoWelcome = guildChannels.find(
          (c) => c.isTextBased() && (c.name.includes('welcome') || c.name.includes('general'))
        );
        const autoGoodbye = guildChannels.find(
          (c) => c.isTextBased() && (c.name.includes('goodbye') || c.name.includes('welcome') || c.name.includes('general'))
        );
        const autoLog = guildChannels.find(
          (c) => c.isTextBased() && (c.name.includes('log') || c.name.includes('audit'))
        );

        if (autoWelcome) config.channels.welcome = autoWelcome.id;
        if (autoGoodbye) config.channels.goodbye = autoGoodbye.id;
        if (autoLog) config.channels.log = autoLog.id;

        saveConfig(config);
        await i.update({ embeds: [buildStatusEmbed(interaction.guild)], components: [row] });
      } else if (i.customId === 'setup_toggle_welcome_img') {
        config.welcomeType = config.welcomeType === 'image' ? 'text' : 'image';
        saveConfig(config);
        await i.update({ embeds: [buildStatusEmbed(interaction.guild)], components: [row] });
      } else if (i.customId === 'setup_toggle_goodbye_img') {
        config.goodbyeType = config.goodbyeType === 'image' ? 'text' : 'image';
        saveConfig(config);
        await i.update({ embeds: [buildStatusEmbed(interaction.guild)], components: [row] });
      } else if (i.customId === 'setup_refresh') {
        await i.update({ embeds: [buildStatusEmbed(interaction.guild)], components: [row] });
      }
    });
  },
};
