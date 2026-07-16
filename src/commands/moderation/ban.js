const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption((o) =>
      o.setName('user').setDescription('The member to ban').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('That member was not found in this server.')], ephemeral: true });
    }
    if (!target.bannable) {
      return interaction.reply({ embeds: [errorEmbed('I cannot ban this member. They may have a higher role than me.')], ephemeral: true });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('You cannot ban yourself.')], ephemeral: true });
    }

    try {
      await target.send({
        embeds: [
          errorEmbed(
            `You have been **banned** from **${interaction.guild.name}**.\n**Reason:** ${reason}`,
            '🔨 You were Banned'
          ),
        ],
      }).catch(() => null); // DM may fail if user has DMs off

      await target.ban({ reason: `${reason} | Banned by ${interaction.user.tag}` });

      await interaction.reply({
        embeds: [successEmbed(`**${target.user.tag}** has been banned.\n**Reason:** ${reason}`)],
      });

      // Log the action
      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '🔨 Member Banned',
          color: config.color.error,
          description: `**${target.user.tag}** was banned from the server.`,
          fields: [
            { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: 'Reason', value: reason, inline: false },
          ],
          thumbnail: target.user.displayAvatarURL({ dynamic: true }),
        })
      );
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed to ban: ${err.message}`)], ephemeral: true });
    }
  },
};
