const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { readData, writeData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const config = require('../../../config.json');

/**
 * Parse a duration string like "1h", "30m", "2d" into milliseconds.
 */
function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multiplier[unit];
}

/**
 * Pick `count` random winners from an array of user IDs.
 */
function pickWinners(entries, count) {
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  return [...new Set(shuffled)].slice(0, count);
}

/**
 * End a giveaway: pick winners, update embed.
 * @param {import('discord.js').Client} client
 * @param {object} giveaway
 */
async function endGiveaway(client, giveaway) {
  try {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!message) return;

    const giveaways = readData('giveaways.json');
    const idx = giveaways.findIndex((g) => g.id === giveaway.id);

    const winners =
      giveaway.entries.length > 0
        ? pickWinners(giveaway.entries, giveaway.winners)
        : [];

    // Update stored record
    if (idx !== -1) {
      giveaways[idx].ended = true;
      giveaways[idx].winnerIds = winners;
      writeData('giveaways.json', giveaways);
    }

    const winnersText =
      winners.length > 0
        ? winners.map((id) => `<@${id}>`).join(', ')
        : 'No winners (no entries)';

    const endEmbed = new EmbedBuilder()
      .setTitle(`🎉 Giveaway Ended — ${giveaway.prize}`)
      .setColor(config.color.warning)
      .addFields(
        { name: '🏆 Winner(s)', value: winnersText, inline: false },
        { name: '👥 Total Entries', value: `${giveaway.entries.length}`, inline: true },
      )
      .setFooter({ text: `Hosted by ${giveaway.hostedBy}` })
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_ended')
        .setLabel('🎉 Giveaway Ended')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await message.edit({ embeds: [endEmbed], components: [disabledRow] });

    if (winners.length > 0) {
      await channel.send({
        content: `🎉 Congratulations ${winnersText}! You won **${giveaway.prize}**!`,
      });
    }
  } catch (err) {
    console.error('[Giveaway] Error ending giveaway:', err.message);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption((o) => o.setName('prize').setDescription('The prize').setRequired(true))
    .addStringOption((o) =>
      o.setName('duration').setDescription('Duration (e.g. 1h, 30m, 2d)').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20)
    ),

  endGiveaway,

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const prize = interaction.options.getString('prize');
    const durationStr = interaction.options.getString('duration');
    const winnerCount = interaction.options.getInteger('winners');

    const ms = parseDuration(durationStr);
    if (!ms) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid duration. Use format like `1h`, `30m`, or `2d`.')],
        ephemeral: true,
      });
    }

    const endsAt = new Date(Date.now() + ms);
    const endsAtUnix = Math.floor(endsAt.getTime() / 1000);
    const id = Date.now().toString();

    const embed = new EmbedBuilder()
      .setTitle(`🎉 Giveaway — ${prize}`)
      .setColor(config.color.primary)
      .setDescription(`Click the button below to enter!\n\n**Prize:** ${prize}`)
      .addFields(
        { name: '⏰ Ends', value: `<t:${endsAtUnix}:R>`, inline: true },
        { name: '🏆 Winners', value: `${winnerCount}`, inline: true },
        { name: '👥 Entries', value: '0', inline: true },
      )
      .setFooter({ text: `Hosted by ${interaction.user.tag} • Giveaway ID: ${id}` })
      .setTimestamp(endsAt);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${id}`)
        .setLabel('🎉 Enter Giveaway')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.deferReply({ ephemeral: true });
    const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

    const giveaway = {
      id,
      prize,
      winners: winnerCount,
      endsAt: endsAt.toISOString(),
      channelId: interaction.channel.id,
      messageId: msg.id,
      hostedBy: interaction.user.tag,
      entries: [],
      ended: false,
    };

    const giveaways = readData('giveaways.json');
    giveaways.push(giveaway);
    writeData('giveaways.json', giveaways);

    // Schedule end
    setTimeout(() => endGiveaway(interaction.client, giveaway), ms);

    await interaction.editReply({
      embeds: [successEmbed(`Giveaway for **${prize}** started! Ends <t:${endsAtUnix}:R>.`)],
    });
  },
};
