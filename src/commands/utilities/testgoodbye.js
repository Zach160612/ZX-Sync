const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { generateGoodbyeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const { hasPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testgoodbye')
    .setDescription('Test the goodbye image generation (staff only).'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission denied. This command is restricted to Owner, Admin, and Moderator only.')],
        ephemeral: true,
      });
    }

    try {
      console.log('Starting goodbye image generation for:', interaction.user.username);
      
      // Generate goodbye image for the current user
      const imageBuffer = await generateGoodbyeImage(interaction.member, interaction.guild.name, config.goodbyeImageUrl);
      console.log('Goodbye image generated successfully');
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'goodbye.png' });

      await interaction.reply({ files: [attachment] });
      console.log('Test goodbye sent successfully');
    } catch (err) {
      console.error('Error generating test goodbye image:', err);
      await interaction.reply({ 
        content: `Error generating goodbye image: ${err.message}`,
        ephemeral: true 
      });
    }
  },
};
