const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { generateWelcomeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const config = require('../../../config.json');

const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const { logActivity } = require(path.join(__dirname, '..', '..', 'utils', 'activityLogger.js'));

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // 1. Record activity log
    logActivity({
      type: 'JOIN',
      user: { id: member.id, tag: member.user.tag || member.user.username },
      details: `Member count now: ${member.guild.memberCount}`,
    });

    // 2. Log to staff audit log channel
    try {
      await logAction(
        member.client,
        buildLogEmbed({
          title: '📥 Member Joined',
          color: config.color.success || '#57F287',
          description: `**${member.user.tag}** (${member.id}) has joined the server.`,
          fields: [
            { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Total Members', value: `${member.guild.memberCount}`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false },
          ],
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        })
      );
    } catch (err) {
      console.error('Error logging member join:', err.message);
    }

    // Check if welcome system is enabled
    if (!config.welcomeEnabled) return;

    // Check if welcome channel is configured
    if (!config.channels || !config.channels.welcome) return;

    const welcomeChannel = member.guild.channels.cache.get(config.channels.welcome);
    if (!welcomeChannel) return;

    try {
      const welcomeType = config.welcomeType || 'image';
      const welcomeMessage = config.welcomeMessage || `Welcome to **${member.guild.name}**! We're glad you're here.`;

      if (welcomeType === 'image') {
        // Generate welcome image
        const imageBuffer = await generateWelcomeImage(member, member.guild.name);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

        // Create welcome embed with image
        const embed = new EmbedBuilder()
          .setTitle(`👋 Welcome ${member.user.username}!`)
          .setColor(config.color.primary)
          .setDescription(welcomeMessage)
          .setImage('attachment://welcome.png')
          .setTimestamp()
          .setFooter({ text: `Member #${member.guild.memberCount}` });

        await welcomeChannel.send({ embeds: [embed], files: [attachment] });
      } else {
        // Text-only welcome message
        const embed = new EmbedBuilder()
          .setTitle(`👋 Welcome ${member.user.username}!`)
          .setColor(config.color.primary)
          .setDescription(welcomeMessage)
          .setTimestamp()
          .setFooter({ text: `Member #${member.guild.memberCount}` });

        await welcomeChannel.send({ embeds: [embed] });
      }

      // Auto-role if configured
      if (config.autoRole) {
        const role = member.guild.roles.cache.get(config.autoRole);
        if (role) {
          await member.roles.add(role, 'Auto-role on join');
        }
      }
    } catch (err) {
      console.error('Error sending welcome message:', err);
    }
  },
};
