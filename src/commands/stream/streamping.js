const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const { getStreamData, updateStreamData } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('streamping')
    .setDescription('Toggle the @Stream Alerts notification role for yourself.'),

  async execute(interaction) {
    const streamData = getStreamData(interaction.guild.id);
    let roleId = streamData.streamPingRoleId;
    let role = roleId ? interaction.guild.roles.cache.get(roleId) : null;

    // If role doesn't exist yet, look for any role named 'stream alerts' or 'stream notification'
    if (!role) {
      role = interaction.guild.roles.cache.find(
        (r) =>
          r.name.toLowerCase().includes('stream alert') ||
          r.name.toLowerCase().includes('stream ping') ||
          r.name.toLowerCase().includes('live ping')
      );
      if (role) {
        updateStreamData(interaction.guild.id, { streamPingRoleId: role.id });
      }
    }

    // If still no role, and member has manage roles, offer to create it or prompt
    if (!role) {
      return interaction.reply({
        content:
          '❌ No Stream Notification role has been configured on this server yet. A server moderator can set one up with `/stream setrole`.',
        ephemeral: true,
      });
    }

    const member = interaction.member;
    const hasRole = member.roles.cache.has(role.id);

    try {
      if (hasRole) {
        await member.roles.remove(role, 'User toggled off stream notifications');
        return interaction.reply({
          content: `🔕 You will no longer receive **${role.name}** stream notifications. You can turn them back on anytime with \`/streamping\`!`,
          ephemeral: true,
        });
      } else {
        await member.roles.add(role, 'User toggled on stream notifications');
        return interaction.reply({
          content: `🔔 You now have the **${role.name}** role! You'll be notified whenever the stream goes live. 🚀`,
          ephemeral: true,
        });
      }
    } catch (err) {
      return interaction.reply({
        content: `❌ Could not update your role: ${err.message}. Make sure the bot's role is positioned above **${role.name}** in Server Settings > Roles.`,
        ephemeral: true,
      });
    }
  },
};
