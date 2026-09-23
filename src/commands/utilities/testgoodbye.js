const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { generateGoodbyeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testgoodbye')
    .setDescription('Test the goodbye image generation (staff only).'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    await interaction.deferReply();

    try {
      console.log('Starting goodbye image generation for:', interaction.user.username);
      
      // Generate goodbye image for the current user
      const imageBuffer = await generateGoodbyeImage(interaction.member, interaction.guild.name, config.goodbyeImageUrl);
      console.log('Goodbye image generated successfully');
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'goodbye.png' });

      // Create goodbye embed
      const embed = new EmbedBuilder()
        .setTitle(`👋 Goodbye ${interaction.user.username}!`)
        .setColor(config.color.warning || config.color.error || '#ED4245')
        .setDescription('This is a test of the goodbye image generation.')
        .setImage('attachment://goodbye.png')
        .setTimestamp()
        .setFooter({ text: `Member #${interaction.guild.memberCount}` });

      await interaction.editReply({ embeds: [embed], files: [attachment] });
      console.log('Test goodbye sent successfully');
    } catch (err) {
      console.error('Error generating test goodbye image:', err);
      await interaction.editReply({ content: `Error generating goodbye image: ${err.message}` });
    }
  },
};
