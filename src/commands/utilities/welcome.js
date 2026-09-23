const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome settings (channel, custom background image, format, message).')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('The channel to send welcome messages to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addAttachmentOption((o) =>
      o
        .setName('image')
        .setDescription('Upload a custom background image for welcome card')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('imageurl')
        .setDescription('Provide an image URL for custom welcome background')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Welcome card format type')
        .setRequired(false)
        .addChoices(
          { name: '🎨 Image Banner Card', value: 'image' },
          { name: '📝 Text Embed', value: 'text' }
        )
    )
    .addStringOption((o) =>
      o
        .setName('message')
        .setDescription('Custom welcome message description text')
        .setRequired(false)
    )
    .addBooleanOption((o) =>
      o
        .setName('resetimage')
        .setDescription('Reset custom welcome background back to default design')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const channel = interaction.options.getChannel('channel');
    const imageAttachment = interaction.options.getAttachment('image');
    const imageUrl = interaction.options.getString('imageurl');
    const type = interaction.options.getString('type');
    const message = interaction.options.getString('message');
    const resetImage = interaction.options.getBoolean('resetimage');

    if (!channel && !imageAttachment && !imageUrl && !type && !message && resetImage === null) {
      // Display current welcome config status
      const currentChannel = config.channels?.welcome ? `<#${config.channels.welcome}>` : 'Not set';
      const currentType = config.welcomeType || 'text';
      const currentBg = config.welcomeImageUrl ? `[Custom Image](${config.welcomeImageUrl})` : 'Default Gradient';
      const currentMsg = config.welcomeMessage || `Welcome to **${interaction.guild.name}**! We're glad you're here.`;

      const statusEmbed = new EmbedBuilder()
        .setTitle('👋 Welcome System Settings')
        .setColor(config.color.primary || '#5865F2')
        .addFields(
          { name: 'Channel', value: currentChannel, inline: true },
          { name: 'Format Type', value: currentType === 'image' ? '🎨 Image Card' : '📝 Text Embed', inline: true },
          { name: 'Custom Background', value: currentBg, inline: true },
          { name: 'Welcome Message', value: currentMsg, inline: false }
        )
        .setFooter({ text: 'Use /welcome with options to update any setting' });

      return interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }

    const configPath = path.join(__dirname, '..', '..', '..', 'config.json');

    try {
      const changes = [];

      if (!config.channels) config.channels = {};

      if (channel) {
        config.channels.welcome = channel.id;
        changes.push(`Channel: ${channel}`);
      }

      if (resetImage) {
        delete config.welcomeImageUrl;
        changes.push('Background: Reset to default design');
      } else if (imageAttachment) {
        config.welcomeImageUrl = imageAttachment.url;
        config.welcomeType = 'image';
        changes.push(`Custom Image: Attachment set ([View](${imageAttachment.url}))`);
      } else if (imageUrl) {
        config.welcomeImageUrl = imageUrl;
        config.welcomeType = 'image';
        changes.push(`Custom Image: URL set ([View](${imageUrl}))`);
      }

      if (type) {
        config.welcomeType = type;
        changes.push(`Format Type: **${type}**`);
      }

      if (message) {
        config.welcomeMessage = message;
        changes.push(`Message: "${message}"`);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const responseEmbed = successEmbed(`✅ **Welcome Settings Updated**\n\n${changes.join('\n')}`);

      await interaction.reply({ embeds: [responseEmbed] });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '👋 Welcome System Updated',
          color: config.color.success,
          description: `Welcome settings updated by **${interaction.user.tag}**.`,
          fields: [{ name: 'Changes', value: changes.join('\n'), inline: false }],
        })
      );
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Failed to update welcome settings: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

