const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const path = require('path');
const { getStreamData } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('View the weekly streaming schedule and upcoming broadcasts.'),

  async execute(interaction) {
    const streamData = getStreamData(interaction.guild.id);
    const schedule = streamData.schedule || [];

    const embed = new EmbedBuilder()
      .setTitle(`📅 ${interaction.guild.name} — Stream Schedule`)
      .setColor(config.color?.primary || '#5865F2')
      .setDescription('Here is our planned streaming schedule for the week! Times are subject to minor updates.')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || interaction.client.user.displayAvatarURL())
      .setFooter({ text: 'ZX Sync • Turn on stream alerts to get notified when we go live' })
      .setTimestamp();

    if (schedule.length === 0) {
      embed.addFields({
        name: '📺 Weekly Schedule',
        value:
          'No stream schedule has been set yet! Staff can configure the schedule using `/stream setschedule` (e.g. `/stream setschedule day:Friday time:8:00 PM EST game:Valorant`).',
      });
    } else {
      const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const sorted = [...schedule].sort((a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day));

      for (const item of sorted) {
        let value = `⏰ **Time:** \`${item.time}\`\n🎮 **Game:** ${item.game || 'Variety / Just Chatting'}`;
        if (item.note) {
          value += `\n💬 **Notes:** *${item.note}*`;
        }
        embed.addFields({
          name: `🗓️ ${item.day}`,
          value,
          inline: false,
        });
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('stream_ping_toggle')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('🔔 Toggle Stream Alerts')
    );

    // If twitch or kick link exists, add link button
    const twitchLink = streamData.socials?.twitch || streamData.socials?.kick || streamData.socials?.youtube;
    if (twitchLink) {
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('🔴 Go To Channel')
          .setURL(twitchLink)
      );
    }

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
