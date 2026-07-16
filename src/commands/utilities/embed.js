const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { errorEmbed, successEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Build and send a custom embed announcement.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption((o) => o.setName('description').setDescription('Embed body text').setRequired(true))
    .addStringOption((o) => o.setName('color').setDescription('Hex color (e.g. #5865F2)').setRequired(false))
    .addStringOption((o) => o.setName('image').setDescription('Image URL').setRequired(false))
    .addStringOption((o) => o.setName('thumbnail').setDescription('Thumbnail URL').setRequired(false))
    .addStringOption((o) => o.setName('footer').setDescription('Footer text').setRequired(false))
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to send the embed to (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const colorStr = interaction.options.getString('color');
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');
    const footer = interaction.options.getString('footer');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    // Parse color
    let color = config.color.primary;
    if (colorStr) {
      const cleaned = colorStr.startsWith('#') ? colorStr.slice(1) : colorStr;
      const parsed = parseInt(cleaned, 16);
      if (!isNaN(parsed) && cleaned.length === 6) {
        color = parsed;
      } else {
        return interaction.reply({
          embeds: [errorEmbed('Invalid hex color. Use format `#RRGGBB`.')],
          ephemeral: true,
        });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({ text: footer });

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({
        embeds: [successEmbed(`Embed sent to ${channel}.`)],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Failed to send embed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
