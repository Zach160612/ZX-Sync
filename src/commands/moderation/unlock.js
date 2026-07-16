const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel to restore normal messaging.')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to unlock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null, // Reset to default (inherit from category/role)
      });

      await channel.send({
        embeds: [
          successEmbed(
            `🔓 This channel has been **unlocked** by ${interaction.user}.\nEveryone can send messages again.`,
            '🔓 Channel Unlocked'
          ),
        ],
      });

      if (channel.id !== interaction.channel.id) {
        await interaction.reply({
          embeds: [successEmbed(`${channel} has been unlocked.`)],
          ephemeral: true,
        });
      } else {
        await interaction.reply({ embeds: [successEmbed('Channel unlocked.')], ephemeral: true });
      }
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed to unlock channel: ${err.message}`)], ephemeral: true });
    }
  },
};
