const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { readData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('events')
    .setDescription('List all upcoming events.'),

  async execute(interaction) {
    const allEvents = readData('events.json');
    const now = Date.now();

    const upcoming = allEvents
      .filter((e) => new Date(e.timestamp).getTime() > now)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (upcoming.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📅 Upcoming Events')
        .setColor(config.color.primary)
        .setDescription('There are no upcoming events scheduled.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📅 Upcoming Events')
      .setColor(config.color.primary)
      .setDescription(`**${upcoming.length}** upcoming event(s):`)
      .setTimestamp();

    for (const event of upcoming.slice(0, 10)) {
      const rsvpCounts = `✅ ${event.rsvp.going.length} • ❔ ${event.rsvp.maybe.length} • ❌ ${event.rsvp.cantAttend.length}`;
      embed.addFields({
        name: `📌 ${event.name}`,
        value: `${event.dateDisplay}\n${rsvpCounts}\nID: \`${event.id}\``,
        inline: false,
      });
    }

    if (upcoming.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${upcoming.length} events.` });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
