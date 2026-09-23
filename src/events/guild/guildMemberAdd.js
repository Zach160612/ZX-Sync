const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { generateWelcomeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const config = require('../../../config.json');

const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const { logActivity } = require(path.join(__dirname, '..', '..', 'utils', 'activityLogger.js'));
const { getUserLevel, getLevelInfo } = require(path.join(__dirname, '..', '..', 'utils', 'levelSystem.js'));

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

    // 3. Check if welcome system is enabled
    if (config.welcomeEnabled === false) return;

    // 4. Auto-resolve welcome channel (configured ID or any text channel named welcome/general)
    let welcomeChannel = null;
    if (config.channels && config.channels.welcome) {
      welcomeChannel = member.guild.channels.cache.get(config.channels.welcome);
    }

    if (!welcomeChannel) {
      welcomeChannel = member.guild.channels.cache.find(
        (ch) => ch.isTextBased() && (ch.name.includes('welcome') || ch.name.includes('general'))
      );
    }

    if (!welcomeChannel) return;

    try {
      const welcomeType = config.welcomeType || 'text';
      const rawMessage = config.welcomeMessage || `Welcome to **{server}**, {user}! 🚀 We're glad you're here.`;
      const welcomeMessage = rawMessage
        .replace(/\{user\}/g, `<@${member.id}>`)
        .replace(/\{username\}/g, member.user.username)
        .replace(/\{userTag\}/g, member.user.tag || member.user.username)
        .replace(/\{server\}/g, member.guild.name)
        .replace(/\{memberCount\}/g, member.guild.memberCount);

      if (welcomeType === 'image') {
        try {
          // Generate welcome image
          const imageBuffer = await generateWelcomeImage(member, member.guild.name, config.welcomeImageUrl);
          const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

          const embed = new EmbedBuilder()
            .setTitle(`👋 Welcome ${member.user.username}!`)
            .setColor(config.color.primary || '#5865F2')
            .setDescription(welcomeMessage)
            .setImage('attachment://welcome.png')
            .setTimestamp()
            .setFooter({ text: `Member #${member.guild.memberCount}` });

          await welcomeChannel.send({ embeds: [embed], files: [attachment] });
        } catch (imgErr) {
          console.error('Image generation failed, falling back to text welcome embed:', imgErr.message);
          // Fallback to text embed
          const embed = new EmbedBuilder()
            .setTitle(`👋 Welcome to ${member.guild.name}, ${member.user.username}!`)
            .setColor(config.color.primary || '#5865F2')
            .setDescription(welcomeMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Member #${member.guild.memberCount}` });

          await welcomeChannel.send({ embeds: [embed] });
        }
      } else {
        // Text-only welcome message
        const embed = new EmbedBuilder()
          .setTitle(`👋 Welcome to ${member.guild.name}, ${member.user.username}!`)
          .setColor(config.color.primary || '#5865F2')
          .setDescription(welcomeMessage)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setFooter({ text: `Member #${member.guild.memberCount}` });

        await welcomeChannel.send({ embeds: [embed] });
      }

      // Auto-role assignment
      const autoRolesList = Array.isArray(config.autoRoles) && config.autoRoles.length > 0
        ? config.autoRoles
        : (config.autoRole ? [config.autoRole] : []);

      for (const roleKey of autoRolesList) {
        if (!roleKey) continue;
        const role = member.guild.roles.cache.get(roleKey) || member.guild.roles.cache.find((r) => r.name.toLowerCase() === roleKey.toLowerCase());
        if (role) {
          await member.roles.add(role, 'Auto-role on join').catch((err) => console.error(`Failed to assign auto-role ${role.name}:`, err.message));
        }
      }

      // Set nickname with level emoji
      try {
        const level = getUserLevel(member);
        const levelInfo = getLevelInfo(level);
        const newNick = `${levelInfo.emoji} ${member.user.username}`;
        if (member.manageable) {
          await member.setNickname(newNick).catch(() => {}); // Silently fail if no permission
        }
      } catch (err) {
        console.error('Failed to set level nickname:', err.message);
      }
    } catch (err) {
      console.error('Error sending welcome message:', err.message);
    }
  },
};
