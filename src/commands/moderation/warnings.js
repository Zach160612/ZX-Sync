const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { readData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View all warnings for a member.')
    .addUserOption((o) =>
      o.setName('user').setDescription('The member to check').setRequired(true)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const target = interaction.options.getUser('user');
    const warnings = readData('warnings.json');
    const userWarnings = warnings[target.id] || [];

    if (userWarnings.length === 0) {
      return interaction.reply({
        embeds: [errorEmbed(`**${target.tag}** has no warnings.`)],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings — ${target.tag}`)
      .setColor(config.color.warning)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${userWarnings.length}** warning(s) on record.`)
      .setTimestamp();

    // Show last 10 warnings to avoid embed limits
    const shown = userWarnings.slice(-10);
    for (let i = 0; i < shown.length; i++) {
      const w = shown[i];
      const date = new Date(w.timestamp).toLocaleDateString('en-US', { dateStyle: 'medium' });
      embed.addFields({
        name: `#${userWarnings.length - shown.length + i + 1} — ${date}`,
        value: `**Reason:** ${w.reason}\n**Moderator:** ${w.moderator}`,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
