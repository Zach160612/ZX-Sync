const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const path = require('path');
const { addClip, getRandomClip, getClips } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clip')
    .setDescription('Submit, watch, and browse community stream clips.')
    .addSubcommand((sub) =>
      sub
        .setName('submit')
        .setDescription('Submit an epic or funny stream clip to the server showcase')
        .addStringOption((opt) =>
          opt
            .setName('url')
            .setDescription('Clip link (Twitch clip, YouTube short, Medal, TikTok, etc.)')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('title')
            .setDescription('Title or funny caption for the clip')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('random')
        .setDescription('Watch a random stream clip submitted by the community')
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Browse recent community stream clips')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ─────────────────────────────────────────────
    // SUBMIT
    // ─────────────────────────────────────────────
    if (sub === 'submit') {
      const url = interaction.options.getString('url');
      const title = interaction.options.getString('title');

      // Basic URL check
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return interaction.reply({
          content: '❌ Please enter a valid URL starting with https:// or http://',
          ephemeral: true,
        });
      }

      const clip = addClip(guildId, {
        title,
        url,
        authorId: interaction.user.id,
        authorTag: interaction.user.username,
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎬 New Community Clip: ${title}`)
        .setURL(url)
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(`Submitted by <@${interaction.user.id}>! Click the button below to watch the highlight!`)
        .setFooter({ text: 'ZX Stream Community Clips • Submit yours with /clip submit' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('▶️ Watch Clip')
          .setURL(url)
      );

      return interaction.reply({
        content: `🎉 Clip **"${title}"** added to the showcase!`,
        embeds: [embed],
        components: [row],
      });
    }

    // ─────────────────────────────────────────────
    // RANDOM
    // ─────────────────────────────────────────────
    if (sub === 'random') {
      const clip = getRandomClip(guildId);
      if (!clip) {
        return interaction.reply({
          content: '🎬 No clips have been submitted yet! Be the first to share one using `/clip submit <url> <title>`!',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎲 Stream Clip: ${clip.title}`)
        .setURL(clip.url)
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(`Clipped & submitted by **${clip.authorTag}** on <t:${Math.floor(new Date(clip.createdAt).getTime() / 1000)}:D>`)
        .setFooter({ text: 'ZX Community Clips • Type /clip random for another' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('▶️ Watch Clip')
          .setURL(clip.url)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
      });
    }

    // ─────────────────────────────────────────────
    // LIST
    // ─────────────────────────────────────────────
    if (sub === 'list') {
      const clips = getClips(guildId);
      if (clips.length === 0) {
        return interaction.reply({
          content: '🎬 No clips in the archive yet. Use `/clip submit` to add the first one!',
          ephemeral: true,
        });
      }

      const recent = clips.slice(0, 8);
      const fields = recent.map(
        (c, i) => `${i + 1}. [**${c.title}**](${c.url}) — by *${c.authorTag}* (<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>)`
      );

      const embed = new EmbedBuilder()
        .setTitle(`🎬 Community Stream Clips (${clips.length} total)`)
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(fields.join('\n\n'))
        .setFooter({ text: 'Submit your favorite highlights with /clip submit' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
