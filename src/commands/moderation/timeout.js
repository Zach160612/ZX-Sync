const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

const DURATION_UNITS = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member for a specified duration.')
    .addUserOption((o) =>
      o.setName('user').setDescription('The member to timeout').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('duration').setDescription('Duration amount').setRequired(true).setMinValue(1).setMaxValue(28)
    )
    .addStringOption((o) =>
      o.setName('unit')
        .setDescription('Duration unit')
        .setRequired(true)
        .addChoices(
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' },
          { name: 'Days', value: 'days' }
        )
    )
    .addStringOption((o) =>
      o.setName('reason').setDescription('Reason for the timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const target = interaction.options.getMember('user');
    const duration = interaction.options.getInteger('duration');
    const unit = interaction.options.getString('unit');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('That member was not found.')], ephemeral: true });
    }
    if (!target.moderatable) {
      return interaction.reply({ embeds: [errorEmbed('I cannot timeout this member.')], ephemeral: true });
    }

    const ms = duration * DURATION_UNITS[unit];
    const displayDuration = `${duration} ${unit}`;

    try {
      await target.timeout(ms, `${reason} | Timed out by ${interaction.user.tag}`);

      await target.send({
        embeds: [
          errorEmbed(
            `You have been timed out in **${interaction.guild.name}** for **${displayDuration}**.\n**Reason:** ${reason}`,
            '🔇 You were Timed Out'
          ),
        ],
      }).catch(() => null);

      await interaction.reply({
        embeds: [
          successEmbed(
            `**${target.user.tag}** has been timed out for **${displayDuration}**.\n**Reason:** ${reason}`
          ),
        ],
      });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '🔇 Member Timed Out',
          color: config.color.warning,
          description: `**${target.user.tag}** was timed out.`,
          fields: [
            { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: 'Duration', value: displayDuration, inline: true },
            { name: 'Reason', value: reason, inline: false },
          ],
          thumbnail: target.user.displayAvatarURL({ dynamic: true }),
        })
      );
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed to timeout: ${err.message}`)], ephemeral: true });
    }
  },
};
