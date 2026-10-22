const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { generateWelcomeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const { hasPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Test the welcome image generation (staff only).'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed('Permission denied. This command is restricted to Owner, Admin, and Moderator only.')],
        ephemeral: true,
      });
    }

    try {
      console.log('Starting welcome image generation for:', interaction.user.username);
      
      // Generate welcome image for the current user
      const imageBuffer = await generateWelcomeImage(interaction.member, interaction.guild.name, config.welcomeImageUrl);
      console.log('Image generated successfully');
      
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

      await interaction.reply({ files: [attachment] });
      console.log('Test welcome sent successfully');
    } catch (err) {
      console.error('Error generating test welcome image:', err);
      await interaction.reply({ 
        content: `Error generating welcome image: ${err.message}`,
        ephemeral: true 
      });
    }
  },
};
