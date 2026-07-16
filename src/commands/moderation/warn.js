const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { readData, writeData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a server member.')
    .addUserOption((o) =>
      o.setName('user').setDescription('The member to warn').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('reason').setDescription('Reason for the warning').setRequired(true)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('That member was not found in this server.')], ephemeral: true });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('You cannot warn yourself.')], ephemeral: true });
    }

    // Save warning
    const warnings = readData('warnings.json');
    const userId = target.id;
    if (!warnings[userId]) warnings[userId] = [];

    const warning = {
      id: Date.now().toString(),
      reason,
      moderator: interaction.user.tag,
      moderatorId: interaction.user.id,
      timestamp: new Date().toISOString(),
    };
    warnings[userId].push(warning);
    writeData('warnings.json', warnings);

    const warningCount = warnings[userId].length;

    // DM the user
    await target.send({
      embeds: [
        errorEmbed(
          `You have received a warning in **${interaction.guild.name}**.\n**Reason:** ${reason}\nYou now have **${warningCount}** warning(s).`,
          '⚠️ Warning Received'
        ),
      ],
    }).catch(() => null);

    await interaction.reply({
      embeds: [
        successEmbed(
          `**${target.user.tag}** has been warned.\n**Reason:** ${reason}\nThey now have **${warningCount}** warning(s).`
        ),
      ],
    });

    await logAction(
      interaction.client,
      buildLogEmbed({
        title: '⚠️ Member Warned',
        color: config.color.warning,
        description: `**${target.user.tag}** received a warning.`,
        fields: [
          { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Total Warnings', value: `${warningCount}`, inline: true },
          { name: 'Reason', value: reason, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true }),
      })
    );
  },
};
