const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member, client) {
    const goodbyeChannelId = config.channels?.goodbye;
    if (!goodbyeChannelId || goodbyeChannelId === 'GOODBYE_CHANNEL_ID_HERE') return;

    try {
      const channel = await client.channels.fetch(goodbyeChannelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setTitle(`👋 Goodbye, ${member.user.username}`)
        .setColor(config.color.error)
        .setDescription(
          `**${member.user.tag}** has left the server.\n\n${member.guild.name} now has **${member.guild.memberCount.toLocaleString()}** member(s).`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
        .addFields(
          { name: '👤 User', value: member.user.tag, inline: true },
          { name: '🆔 User ID', value: member.id, inline: true },
          { name: '📅 Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Unknown', inline: true },
        )
        .setFooter({ text: config.botName })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[GuildMemberRemove]', err.message);
    }
  },
};
