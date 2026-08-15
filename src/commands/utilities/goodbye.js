const { SlashCommandBuilder, ChannelType } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('Set the channel where goodbye messages are sent when someone leaves.')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('The channel to send goodbye messages to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const channel = interaction.options.getChannel('channel');
    const configPath = path.join(__dirname, '..', '..', '..', 'config.json');

    try {
      if (!config.channels) config.channels = {};
      config.channels.goodbye = channel.id;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await interaction.reply({
        embeds: [successEmbed(`✅ Goodbye channel set to ${channel}. Members will be farewelled there when they leave!`)],
      });

      await logAction(interaction.client, buildLogEmbed({
        title: '🚪 Goodbye Channel Updated',
        color: config.color.success,
        description: `Goodbye channel set to ${channel} by **${interaction.user.tag}**.`,
        fields: [{ name: 'Channel', value: `${channel} (${channel.id})`, inline: true }],
      }));
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed(`Failed to set goodbye channel: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
