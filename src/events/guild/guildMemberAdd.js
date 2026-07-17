const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { generateWelcomeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const config = require('../../../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
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
