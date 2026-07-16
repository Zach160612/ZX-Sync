const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency and Discord API latency.'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Measuring...',
      fetchReply: true,
    });

    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(config.color.primary)
      .addFields(
        { name: 'Bot Latency', value: `\`${botLatency}ms\``, inline: true },
        { name: 'API Latency', value: `\`${apiLatency}ms\``, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
