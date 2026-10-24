const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../../../config.json');

const HYPE_LEVELS = [
  { level: 1, name: '⚡ Level 1: Spark', required: 5, color: '#3498DB', emoji: '⚡' },
  { level: 2, name: '📈 Level 2: Rising Heat', required: 15, color: '#F1C40F', emoji: '📈' },
  { level: 3, name: '🔥 Level 3: Wildfire', required: 30, color: '#E67E22', emoji: '🔥' },
  { level: 4, name: '💥 Level 4: Supernova', required: 50, color: '#E74C3C', emoji: '💥' },
  { level: 5, name: '🚀🚂 MAXIMUM HYPE TRAIN', required: 75, color: '#9B59B6', emoji: '👑' },
];

function getProgressBar(current, target, totalBars = 15) {
  const ratio = Math.min(1, current / target);
  const filledBars = Math.round(ratio * totalBars);
  const emptyBars = totalBars - filledBars;
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
}

function getCurrentHypeLevel(hypes) {
  let active = HYPE_LEVELS[0];
  for (const lvl of HYPE_LEVELS) {
    if (hypes >= lvl.required) {
      active = lvl;
    }
  }
  return active;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hype')
    .setDescription('Launch a 60-second community Hype Train! Click the button to power up the meter!'),

  async execute(interaction) {
    let totalHypes = 0;
    const contributors = new Map(); // userId -> { count, username }
    const DURATION_SECONDS = 45;
    const expiresAt = Math.floor((Date.now() + DURATION_SECONDS * 1000) / 1000);

    function buildEmbed(isFinished = false) {
      const currentLevel = getCurrentHypeLevel(totalHypes);
      const nextLevelIndex = HYPE_LEVELS.findIndex((l) => l.level === currentLevel.level) + 1;
      const nextLevel = HYPE_LEVELS[nextLevelIndex] || null;

      const target = nextLevel ? nextLevel.required : currentLevel.required;
      const bar = getProgressBar(totalHypes, target);

      // Top Hypers
      const sortedContributors = [...contributors.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topText =
        sortedContributors.length > 0
          ? sortedContributors
              .map((c, i) => `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} **${c.username}**: \`${c.count} hypes\``)
              .join('\n')
          : '*Waiting for the first hype click!*';

      const embed = new EmbedBuilder()
        .setTitle(isFinished ? `🏁 Hype Train Complete! — ${currentLevel.name}` : `🚂 COMMUNITY HYPE TRAIN IN PROGRESS!`)
        .setColor(currentLevel.color)
        .setDescription(
          isFinished
            ? `The hype train has reached the station! The community generated a total of **${totalHypes} HYPES**! 🎉`
            : `**SMASH THE HYPE BUTTON!** Boost the hype meter before the timer expires <t:${expiresAt}:R>! 🔥`
        )
        .addFields(
          {
            name: `Level: ${currentLevel.name}`,
            value: `\`[${bar}]\` **${totalHypes}**${nextLevel ? ` / ${nextLevel.required}` : ' (MAX)'} hypes`,
            inline: false,
          },
          {
            name: '👑 Top Hype Contributors',
            value: topText,
            inline: false,
          }
        )
        .setFooter({
          text: isFinished
            ? 'ZX Sync Hype Network • Thank you for hyping up the community!'
            : 'Click as fast as you can to feed the hype train!',
        })
        .setTimestamp();

      return embed;
    }

    const button = new ButtonBuilder()
      .setCustomId('hype_click')
      .setStyle(ButtonStyle.Danger)
      .setLabel('🔥 HYPE! (0)')
      .setEmoji('⚡');

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: '🚨 **A COMMUNITY HYPE TRAIN HAS BEGUN!** 🚨',
      embeds: [buildEmbed(false)],
      components: [row],
    });

    const replyMessage = await interaction.fetchReply();

    const collector = replyMessage.createMessageComponentCollector({
      filter: (i) => i.customId === 'hype_click',
      time: DURATION_SECONDS * 1000,
    });

    let updateTimeout = null;

    collector.on('collect', async (btnInt) => {
      totalHypes++;
      const user = contributors.get(btnInt.user.id) || { count: 0, username: btnInt.user.username };
      user.count++;
      user.username = btnInt.user.username;
      contributors.set(btnInt.user.id, user);

      button.setLabel(`🔥 HYPE! (${totalHypes})`);
      row.components[0] = button;

      // Fast-ack interaction so it feels instant to click
      await btnInt.deferUpdate().catch(() => null);

      // Debounce message edits to avoid Discord rate limits (every 1 second max)
      if (!updateTimeout) {
        updateTimeout = setTimeout(async () => {
          updateTimeout = null;
          await replyMessage
            .edit({
              embeds: [buildEmbed(false)],
              components: [row],
            })
            .catch(() => null);
        }, 800);
      }
    });

    collector.on('end', async () => {
      if (updateTimeout) clearTimeout(updateTimeout);

      button.setDisabled(true).setLabel(`🏁 Final: ${totalHypes} Hypes`);
      const finalRow = new ActionRowBuilder().addComponents(button);

      await replyMessage
        .edit({
          content: '🎉 **THE HYPE TRAIN HAS CONCLUDED!** 🎉',
          embeds: [buildEmbed(true)],
          components: [finalRow],
        })
        .catch(() => null);
    });
  },
};
