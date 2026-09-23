const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('Configure goodbye settings (channel, custom background image, format, message).')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('The channel to send goodbye messages to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addAttachmentOption((o) =>
      o
        .setName('image')
        .setDescription('Upload a custom background image for goodbye card')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('imageurl')
        .setDescription('Provide an image URL for custom goodbye background')
        .setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Goodbye card format type')
        .setRequired(false)
        .addChoices(
          { name: '🎨 Image Banner Card', value: 'image' },
          { name: '📝 Text Embed', value: 'text' }
        )
    )
    .addStringOption((o) =>
      o
        .setName('message')
        .setDescription('Custom goodbye message description text')
        .setRequired(false)
    )
    .addBooleanOption((o) =>
      o
        .setName('resetimage')
        .setDescription('Reset custom goodbye background back to default design')
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
      // Display current goodbye config status
      const currentChannel = config.channels?.goodbye ? `<#${config.channels.goodbye}>` : 'Not set';
      const currentType = config.goodbyeType || 'image';
      const currentBg = config.goodbyeImageUrl ? `[Custom Image](${config.goodbyeImageUrl})` : 'Default Gradient';
      const currentMsg = config.goodbyeMessage || `**{user}** has left the server. We'll miss you! 👋`;

      const statusEmbed = new EmbedBuilder()
        .setTitle('🚪 Goodbye System Settings')
        .setColor(config.color.warning || config.color.error || '#ED4245')
        .addFields(
          { name: 'Channel', value: currentChannel, inline: true },
          { name: 'Format Type', value: currentType === 'image' ? '🎨 Image Card' : '📝 Text Embed', inline: true },
          { name: 'Custom Background', value: currentBg, inline: true },
          { name: 'Goodbye Message', value: currentMsg, inline: false }
        )
        .setFooter({ text: 'Use /goodbye with options to update any setting' });

      return interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }

    const configPath = path.join(__dirname, '..', '..', '..', 'config.json');

    try {
      const changes = [];

      if (!config.channels) config.channels = {};

      if (channel) {
        config.channels.goodbye = channel.id;
        changes.push(`Channel: ${channel}`);
      }

      if (resetImage) {
        delete config.goodbyeImageUrl;
        changes.push('Background: Reset to default design');
      } else if (imageAttachment) {
        config.goodbyeImageUrl = imageAttachment.url;
        config.goodbyeType = 'image';
        changes.push(`Custom Image: Attachment set ([View](${imageAttachment.url}))`);
      } else if (imageUrl) {
        config.goodbyeImageUrl = imageUrl;
        config.goodbyeType = 'image';
        changes.push(`Custom Image: URL set ([View](${imageUrl}))`);
      }

      if (type) {
        config.goodbyeType = type;
        changes.push(`Format Type: **${type}**`);
      }

      if (message) {
        config.goodbyeMessage = message;
        changes.push(`Message: "${message}"`);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const responseEmbed = successEmbed(`✅ **Goodbye Settings Updated**\n\n${changes.join('\n')}`);

      await interaction.reply({ embeds: [responseEmbed] });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '🚪 Goodbye System Updated',
          color: config.color.success,
          description: `Goodbye settings updated by **${interaction.user.tag}**.`,
          fields: [{ name: 'Changes', value: changes.join('\n'), inline: false }],
        })
      );
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Failed to update goodbye settings: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

