const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const { toMathematicalBold } = require(path.join(__dirname, '..', '..', 'utils', 'fontConverter.js'));
const config = require('../../../config.json');

/**
 * Check if a string contains Mathematical Bold Serif font characters.
 */
function hasBoldFont(text) {
  if (!text) return false;
  return /[\u{1D400}-\u{1D433}\u{1D7CE}-\u{1D7D7}]/u.test(text);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('name')
    .setDescription('Manage member bold nicknames (e.g., 𝐙𝐚𝐜𝐡).')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription("Change a member's nickname to a stylish bold font (e.g., 𝐙𝐚𝐜𝐡).")
        .addUserOption((o) => o.setName('user').setDescription('The member whose nickname to change').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('The new name text').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('pending')
        .setDescription('List all members who have not gotten the bold font nickname yet.')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();

    if (sub === 'pending') {
      await interaction.deferReply({ ephemeral: true });

      try {
        const members = await interaction.guild.members.fetch();

        // Filter members without bots and without bold font
        const pendingMembers = members.filter((m) => {
          if (m.user.bot) return false;
          const displayName = m.nickname || m.user.username;
          return !hasBoldFont(displayName);
        });

        if (pendingMembers.size === 0) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('🎉 All Members Updated!')
                .setColor(config.color.success || '#57F287')
                .setDescription('Everyone in the server already has their bold font nickname!')
                .setTimestamp(),
            ],
          });
        }

        const memberList = pendingMembers
          .map((m) => `${m} (${m.nickname ? `\`${m.nickname}\`` : `\`${m.user.username}\``})`)
          .slice(0, 25)
          .join('\n');

        const embed = new EmbedBuilder()
          .setTitle('⏳ Members Pending Bold Font Nickname')
          .setColor(config.color.warning || '#FEE75C')
          .setDescription(
            `Found **${pendingMembers.size}** member(s) without the bold font nickname:\n\n${memberList}` +
            (pendingMembers.size > 25 ? `\n\n*...and ${pendingMembers.size - 25} more.*` : '')
          )
          .setFooter({ text: 'Use /name set user:@Member name:Name to set their font!' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('Error fetching pending members:', err);
        await interaction.editReply({
          embeds: [errorEmbed(`Failed to fetch member list: ${err.message}`)],
        });
      }
      return;
    }

    if (sub === 'set') {
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
    }
  },
};
