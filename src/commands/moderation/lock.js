const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so only staff can send messages.')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to lock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });

      await channel.send({
        embeds: [
          errorEmbed(
            `🔒 This channel has been **locked** by ${interaction.user}.\nOnly staff can send messages.`,
            '🔒 Channel Locked'
          ),
        ],
      });

      if (channel.id !== interaction.channel.id) {
        await interaction.reply({
          embeds: [successEmbed(`${channel} has been locked.`)],
          ephemeral: true,
        });
      } else {
        await interaction.reply({ embeds: [successEmbed('Channel locked.')], ephemeral: true });
      }
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed to lock channel: ${err.message}`)], ephemeral: true });
    }
  },
};
