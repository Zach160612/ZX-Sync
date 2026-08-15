const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const { toMathematicalBold } = require(path.join(__dirname, '..', '..', 'utils', 'fontConverter.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('name')
    .setDescription("Change a member's nickname to a stylish bold font (e.g., 𝐙𝐚𝐜𝐡).")
    .addUserOption((o) => o.setName('user').setDescription('The member whose nickname to change').setRequired(true))
    .addStringOption((o) => o.setName('name').setDescription('The new name text').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const target = interaction.options.getMember('user');
    const rawName = interaction.options.getString('name');

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('That member was not found in this server.')], ephemeral: true });
    }

    if (target.id === interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            'Discord restricts bots from changing the **Server Owner\'s** nickname via the API. Server Owners must set their nickname manually!',
            '👑 Server Owner Restriction'
          ),
        ],
        ephemeral: true,
      });
    }

    if (!target.manageable) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `I cannot change ${target}'s nickname because their role is higher than or equal to my role in the server settings hierarchy.\n\n` +
            '**How to fix:**\n' +
            '1. Go to **Server Settings ➔ Roles** in Discord.\n' +
            '2. Drag the **`ZX Sync`** bot role up so it is above the member\'s highest role!\n' +
            '3. Make sure the bot has the **Manage Nicknames** permission enabled.',
            '⚠️ Role Hierarchy Limit'
          ),
        ],
        ephemeral: true,
      });
    }

    const styledName = toMathematicalBold(rawName);

    if (styledName.length > 32) {
      return interaction.reply({
        embeds: [errorEmbed('The formatted nickname exceeds Discord\'s 32 character limit.')],
        ephemeral: true,
      });
    }

    try {
      const oldNick = target.nickname || target.user.username;
      await target.setNickname(styledName, `Nickname changed by ${interaction.user.tag}`);

      await interaction.reply({
        embeds: [successEmbed(`Changed nickname for ${target} to **${styledName}**!`)],
      });

      // Log the action
      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '✏️ Nickname Formatted',
          color: config.color.info || '#5865F2',
          description: `**${target.user.tag}**'s nickname was changed by ${interaction.user.tag}.`,
          fields: [
            { name: 'User', value: `${target} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: 'Old Name', value: oldNick, inline: false },
            { name: 'New Styled Name', value: styledName, inline: false },
          ],
        })
      );
    } catch (err) {
      console.error('Error setting nickname:', err);
      await interaction.reply({
        embeds: [errorEmbed(`Failed to change nickname: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
