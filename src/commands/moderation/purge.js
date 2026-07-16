const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from this channel.')
    .addIntegerOption((o) =>
      o
        .setName('amount')
        .setDescription('Number of messages to delete (1–100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const amount = interaction.options.getInteger('amount');

    try {
      await interaction.deferReply({ ephemeral: true });

      const deleted = await interaction.channel.bulkDelete(amount, true);

      await interaction.editReply({
        embeds: [
          successEmbed(
            `Successfully deleted **${deleted.size}** message(s).${
              deleted.size < amount
                ? `\n⚠️ Some messages were older than 14 days and could not be deleted.`
                : ''
            }`
          ),
        ],
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to delete messages: ${err.message}`)],
      });
    }
  },
};
