const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { generateGoodbyeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
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

    // 2. Auto-resolve goodbye/welcome channel
    let goodbyeChannel = null;
    if (config.channels && config.channels.goodbye) {
      goodbyeChannel = member.guild.channels.cache.get(config.channels.goodbye);
    }
    if (!goodbyeChannel && config.channels && config.channels.welcome) {
      goodbyeChannel = member.guild.channels.cache.get(config.channels.welcome);
    }
    if (!goodbyeChannel) {
      goodbyeChannel = member.guild.channels.cache.find(
        (ch) => ch.isTextBased() && (ch.name.includes('welcome') || ch.name.includes('goodbye') || ch.name.includes('general'))
      );
    }

    if (goodbyeChannel) {
      try {
        const goodbyeType = config.goodbyeType || 'image';
        const rawMessage = config.goodbyeMessage || `**{user}** has left {server}. We wish you all the best in your tech journey! 👋`;
        const goodbyeMessage = rawMessage
          .replace(/\{user\}/g, `<@${member.id}>`)
          .replace(/\{username\}/g, member.user.username)
          .replace(/\{userTag\}/g, member.user.tag || member.user.username)
          .replace(/\{server\}/g, member.guild.name)
          .replace(/\{memberCount\}/g, member.guild.memberCount);

        if (goodbyeType === 'image') {
          try {
            const imageBuffer = await generateGoodbyeImage(member, member.guild.name, config.goodbyeImageUrl);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'goodbye.png' });

            const embed = new EmbedBuilder()
              .setTitle(`👋 Goodbye ${member.user.username}`)
              .setColor(config.color.warning || config.color.error || '#ED4245')
              .setDescription(goodbyeMessage)
              .setImage('attachment://goodbye.png')
              .setTimestamp()
              .setFooter({ text: `Member #${member.guild.memberCount}` });

            await goodbyeChannel.send({ embeds: [embed], files: [attachment] });
          } catch (imgErr) {
            console.error('Goodbye image generation failed, falling back to text embed:', imgErr.message);
            const embed = new EmbedBuilder()
              .setTitle(`👋 Goodbye ${member.user.username}`)
              .setColor(config.color.warning || config.color.error || '#ED4245')
              .setDescription(goodbyeMessage)
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .addFields(
                { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: 'User Tag', value: `${member.user.tag || member.user.username}`, inline: true }
              )
              .setTimestamp();

            await goodbyeChannel.send({ embeds: [embed] });
          }
        } else {
          const embed = new EmbedBuilder()
            .setTitle(`👋 Goodbye ${member.user.username}`)
            .setColor(config.color.warning || config.color.error || '#ED4245')
            .setDescription(goodbyeMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
              { name: 'User Tag', value: `${member.user.tag || member.user.username}`, inline: true }
            )
            .setTimestamp();

          await goodbyeChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('Error sending goodbye message:', err.message);
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
