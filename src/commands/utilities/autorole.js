const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage automatic roles assigned to members when they join.')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a role to auto-assign on join.')
        .addRoleOption((o) => o.setName('role').setDescription('The role to auto-assign').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a role from auto-assign on join.')
        .addRoleOption((o) => o.setName('role').setDescription('The role to remove').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('List all current auto-assigned roles.')
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Clear all auto-assigned roles.')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();
    const configPath = path.join(__dirname, '..', '..', '..', 'config.json');

    if (!Array.isArray(config.autoRoles)) {
      config.autoRoles = config.autoRole ? [config.autoRole] : [];
    }

    if (sub === 'add') {
      const role = interaction.options.getRole('role');

      if (config.autoRoles.includes(role.id) || config.autoRoles.includes(role.name)) {
        return interaction.reply({
          embeds: [errorEmbed(`The role **${role.name}** is already in the auto-role list.`)],
          ephemeral: true,
        });
      }

      config.autoRoles.push(role.id);
      config.autoRole = role.id; // Also keep legacy field updated
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      await interaction.reply({
        embeds: [successEmbed(`Role **${role.name}** added to auto-assign on join!`)],
      });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '➕ Auto-Role Added',
          color: config.color.success,
          description: `Role **${role.name}** (${role.id}) added to auto-roles by ${interaction.user.tag}.`,
        })
      );
    } else if (sub === 'remove') {
      const role = interaction.options.getRole('role');

      const index = config.autoRoles.findIndex((r) => r === role.id || r === role.name);
      if (index === -1) {
        return interaction.reply({
          embeds: [errorEmbed(`The role **${role.name}** is not in the auto-role list.`)],
          ephemeral: true,
        });
      }

      config.autoRoles.splice(index, 1);
      config.autoRole = config.autoRoles[0] || '';
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      await interaction.reply({
        embeds: [successEmbed(`Role **${role.name}** removed from auto-assign on join.`)],
      });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '➖ Auto-Role Removed',
          color: config.color.warning,
          description: `Role **${role.name}** (${role.id}) removed from auto-roles by ${interaction.user.tag}.`,
        })
      );
    } else if (sub === 'list') {
      if (config.autoRoles.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.color.info || '#5865F2')
              .setTitle('⚙️ Auto-Roles')
              .setDescription('No auto-assign roles configured.')
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

      const roleList = config.autoRoles
        .map((rIdOrName) => {
          const role = interaction.guild.roles.cache.get(rIdOrName) || interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === rIdOrName.toLowerCase());
          return role ? `<@&${role.id}> (${role.name})` : `\`${rIdOrName}\` (Not found)`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('⚙️ Auto-Assigned Roles on Join')
        .setColor(config.color.primary || '#5865F2')
        .setDescription(roleList)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === 'clear') {
      config.autoRoles = [];
      config.autoRole = '';
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      await interaction.reply({
        embeds: [successEmbed('Cleared all auto-assigned roles.')],
        ephemeral: true,
      });

      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '🧹 Auto-Roles Cleared',
          color: config.color.error,
          description: `Auto-roles cleared by ${interaction.user.tag}.`,
        })
      );
    }
  },
};
