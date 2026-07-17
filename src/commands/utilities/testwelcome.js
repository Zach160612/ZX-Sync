const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { generateWelcomeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Test the welcome image generation (staff only).'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    await interaction.deferReply();

    try {
      console.log('Starting welcome image generation for:', interaction.user.username);
      
      // Generate welcome image for the current user
      const imageBuffer = await generateWelcomeImage(interaction.member, interaction.guild.name);
      console.log('Image generated successfully');
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

      // Create welcome embed
      const embed = new EmbedBuilder()
        .setTitle(`👋 Welcome ${interaction.user.username}!`)
        .setColor(config.color.primary)
        .setDescription('This is a test of the welcome image generation.')
        .setImage('attachment://welcome.png')
        .setTimestamp()
        .setFooter({ text: `Member #${interaction.guild.memberCount}` });

      await interaction.editReply({ embeds: [embed], files: [attachment] });
      console.log('Test welcome sent successfully');
    } catch (err) {
      console.error('Error generating test welcome image:', err);
      await interaction.editReply({ content: `Error generating welcome image: ${err.message}` });
    }
  },
};
