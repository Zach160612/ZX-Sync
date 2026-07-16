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
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a role.')
        .addRoleOption((o) => o.setName('role').setDescription('The role to delete').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('color')
        .setDescription('Change a role\'s color.')
        .addRoleOption((o) => o.setName('role').setDescription('The role to recolor').setRequired(true))
        .addStringOption((o) => o.setName('color').setDescription('New hex color (e.g. #3498DB)').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('give')
        .setDescription('Give a role to a member.')
        .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('The role to give').setRequired(true))
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

      if (colorStr && color === null) {
        return interaction.reply({ embeds: [errorEmbed('Invalid hex color. Use format `#RRGGBB`.')], ephemeral: true });
      }

      try {
        const role = await interaction.guild.roles.create({
          name,
          color: color ?? 0x99aab5,
          reason: `Created by ${interaction.user.tag}`,
        });

        await interaction.reply({
          embeds: [successEmbed(`Role **${role.name}** has been created.`)],
        });

        await logAction(interaction.client, buildLogEmbed({
          title: '🎭 Role Created',
          color: config.color.success,
          description: `Role **${role.name}** was created by ${interaction.user.tag}.`,
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

    // ── COLOR ──
    } else if (sub === 'color') {
      const role = interaction.options.getRole('role');
      const colorStr = interaction.options.getString('color');
      const color = parseColor(colorStr);

      if (color === null) {
        return interaction.reply({ embeds: [errorEmbed('Invalid hex color. Use format `#RRGGBB`.')], ephemeral: true });
      }

      try {
        await role.setColor(color, `Color changed by ${interaction.user.tag}`);
        await interaction.reply({ embeds: [successEmbed(`Color of **${role.name}** updated to \`${colorStr}\`.`)] });
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to change color: ${err.message}`)], ephemeral: true });
      }

    // ── GIVE ──
    } else if (sub === 'give') {
      const member = interaction.options.getMember('user');
      const role = interaction.options.getRole('role');

      if (!member) return interaction.reply({ embeds: [errorEmbed('Member not found.')], ephemeral: true });
      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ embeds: [errorEmbed(`${member} already has the **${role.name}** role.`)], ephemeral: true });
      }

      try {
        await member.roles.add(role, `Role given by ${interaction.user.tag}`);
        await interaction.reply({ embeds: [successEmbed(`Added **${role.name}** to ${member}.`)] });
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to give role: ${err.message}`)], ephemeral: true });
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
