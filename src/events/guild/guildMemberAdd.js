const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member, client) {
    // ── Welcome Message ──
    const welcomeChannelId = config.channels?.welcome;
    if (welcomeChannelId && welcomeChannelId !== 'WELCOME_CHANNEL_ID_HERE') {
      try {
        const channel = await client.channels.fetch(welcomeChannelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle(`👋 Welcome to ${member.guild.name}!`)
            .setColor(config.color.success)
            .setDescription(
              `We're glad you're here, ${member}!\n\nYou are our **${member.guild.memberCount.toLocaleString()}${getOrdinal(member.guild.memberCount)}** member.\n\nPlease read the rules and enjoy your stay! 🎉`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
              { name: '👤 Username', value: member.user.tag, inline: true },
              { name: '🆔 User ID', value: member.id, inline: true },
              { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
            )
            .setFooter({ text: `${config.botName}` })
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('[GuildMemberAdd] Welcome error:', err.message);
      }
    }

    // ── Auto Role ──
    const autoRoleId = config.autoRole;
    if (autoRoleId && autoRoleId !== '') {
      try {
        const role = member.guild.roles.cache.get(autoRoleId);
        if (role) await member.roles.add(role, 'Auto-role on join');
      } catch (err) {
        console.error('[GuildMemberAdd] Auto-role error:', err.message);
      }
    }
  },
};

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
