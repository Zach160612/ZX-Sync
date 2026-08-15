const { EmbedBuilder } = require('discord.js');
const path = require('path');
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const { logActivity } = require(path.join(__dirname, '..', '..', 'utils', 'activityLogger.js'));
const config = require('../../../config.json');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    // 1. Record activity log
    logActivity({
      type: 'LEAVE',
      user: { id: member.id, tag: member.user.tag || member.user.username },
      details: `Member count now: ${member.guild.memberCount}`,
    });

    // 2. Goodbye channel message (if configured or welcome channel used)
    const goodbyeChannelId = (config.channels && (config.channels.goodbye || config.channels.welcome)) || null;
    
    if (goodbyeChannelId) {
      const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);
      if (goodbyeChannel) {
        try {
          const goodbyeMessage = config.goodbyeMessage || `**${member.user.username}** has left the server. We'll miss you! 👋`;

          const embed = new EmbedBuilder()
            .setTitle(`👋 Goodbye ${member.user.username}`)
            .setColor(config.color.warning || config.color.error || '#ED4245')
            .setDescription(goodbyeMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
              { name: 'User Tag', value: `${member.user.tag}`, inline: true }
            )
            .setTimestamp();

          await goodbyeChannel.send({ embeds: [embed] });
        } catch (err) {
          console.error('Error sending goodbye message:', err.message);
        }
      }
    }

    // 3. Log to staff audit log channel
    try {
      await logAction(
        member.client,
        buildLogEmbed({
          title: '🚪 Member Left',
          color: config.color.warning || '#FEE75C',
          description: `**${member.user.tag}** (${member.id}) has left the server.`,
          fields: [
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Total Members', value: `${member.guild.memberCount}`, inline: true },
          ],
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        })
      );
    } catch (err) {
      console.error('Error logging member leave:', err.message);
    }
  },
};
