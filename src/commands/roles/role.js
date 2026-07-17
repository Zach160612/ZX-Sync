const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

// Parse a hex color string and return a number, or null if invalid
function parseColor(colorStr) {
  if (!colorStr) return null;
  const cleaned = colorStr.startsWith('#') ? colorStr.slice(1) : colorStr;
  const parsed = parseInt(cleaned, 16);
  if (isNaN(parsed) || cleaned.length !== 6) return null;
  return parsed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Role management commands.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    // --- Subcommands ---
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new role.')
        .addStringOption((o) => o.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption((o) => o.setName('color').setDescription('Hex color (e.g. #FF5733)').setRequired(false))
        .addUserOption((o) => o.setName('user').setDescription('Choose a user to assign this role to immediately').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a role.')
        .addRoleOption((o) => o.setName('role').setDescription('The role to delete').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a member.')
        .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('The role to remove').setRequired(true))
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();

    // ── CREATE ──
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const colorStr = interaction.options.getString('color');
      const color = parseColor(colorStr);
      const targetUser = interaction.options.getMember('user');

      if (colorStr && color === null) {
        return interaction.reply({ embeds: [errorEmbed('Invalid hex color. Use format `#RRGGBB`.')], ephemeral: true });
      }

      try {
        const role = await interaction.guild.roles.create({
          name,
          color: color ?? 0x99aab5,
          reason: `Created by ${interaction.user.tag}`,
        });

        let description = `Role **${role.name}** has been created.`;
        if (targetUser) {
          await targetUser.roles.add(role, `Assigned upon creation by ${interaction.user.tag}`);
          description = `Role **${role.name}** has been created and assigned to ${targetUser}.`;
        }

        await interaction.reply({
          embeds: [successEmbed(description)],
        });

        await logAction(interaction.client, buildLogEmbed({
          title: '🎭 Role Created',
          color: config.color.success,
          description: `Role **${role.name}** was created by ${interaction.user.tag}.${targetUser ? ` Assigned to ${targetUser.user.tag}.` : ''}`,
          fields: [{ name: 'Role', value: `${role} (${role.id})`, inline: true }],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to create role: ${err.message}`)], ephemeral: true });
      }

    // ── DELETE ──
    } else if (sub === 'delete') {
      const role = interaction.options.getRole('role');
      try {
        const roleName = role.name;
        await role.delete(`Deleted by ${interaction.user.tag}`);
        await interaction.reply({ embeds: [successEmbed(`Role **${roleName}** has been deleted.`)] });

        await logAction(interaction.client, buildLogEmbed({
          title: '🎭 Role Deleted',
          color: config.color.error,
          description: `Role **${roleName}** was deleted by ${interaction.user.tag}.`,
          fields: [],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to delete role: ${err.message}`)], ephemeral: true });
      }

    // ── REMOVE ──
    } else if (sub === 'remove') {
      const member = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');

      if (!member) return interaction.reply({ embeds: [errorEmbed('Member not found.')], ephemeral: true });
      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({ embeds: [errorEmbed(`${member} doesn't have the **${role.name}** role.`)], ephemeral: true });
      }

      try {
        await member.roles.remove(role, `Role removed by ${interaction.user.tag}`);
        await interaction.reply({ embeds: [successEmbed(`Removed **${role.name}** from ${member}.`)] });
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to remove role: ${err.message}`)], ephemeral: true });
      }
    }
  },
};
