const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlockall')
    .setDescription('Unlock all channels configured in setup'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    if (!Array.isArray(config.lockChannels) || config.lockChannels.length === 0) {
      return interaction.reply({
        embeds: [errorEmbed('No lock channels configured. Use `/setup lock_channels` to configure channels to lock.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    let unlockedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const channelId of config.lockChannels) {
      try {
        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
          failedCount++;
          errors.push(`Channel ${channelId} not found`);
          continue;
        }

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: null,
        });

        await channel.send({
          embeds: [
            successEmbed(
              `🔓 This channel has been **unlocked** by ${interaction.user}.\nEveryone can now send messages.`,
              '🔓 Channel Unlocked'
            ),
          ],
        });

        unlockedCount++;
      } catch (err) {
        failedCount++;
        errors.push(`Failed to unlock ${channelId}: ${err.message}`);
      }
    }

    const embed = successEmbed(
      `✅ **Unlock All Complete**\n\nUnlocked: **${unlockedCount}** channels\nFailed: **${failedCount}** channels${
        errors.length > 0 ? `\n\nErrors:\n${errors.slice(0, 3).join('\n')}` : ''
      }`
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
