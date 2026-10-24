const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const path = require('path');
const { addQuote, getRandomQuote, getQuotes } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Save, roll, and view hilarious quotes said on stream.')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Save a funny or iconic quote said on stream')
        .addStringOption((opt) =>
          opt
            .setName('quote')
            .setDescription('The quote said on stream')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('context')
            .setDescription('Context or what was happening (e.g. dying to a creeper, missing the clutch)')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('random')
        .setDescription('Display a random out-of-context stream quote')
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('View recently saved stream quotes')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ─────────────────────────────────────────────
    // ADD
    // ─────────────────────────────────────────────
    if (sub === 'add') {
      const quoteText = interaction.options.getString('quote');
      const context = interaction.options.getString('context') || '';

      const quote = addQuote(guildId, {
        quote: quoteText,
        context,
        authorId: interaction.user.id,
        authorTag: interaction.user.username,
      });

      const embed = new EmbedBuilder()
        .setTitle('🎙️ Stream Quote Recorded!')
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(`### "${quote.quote}"\n${quote.context ? `*— Context: ${quote.context}*\n` : ''}\nAdded by <@${interaction.user.id}>`)
        .setFooter({ text: 'ZX Stream Quotes • Type /quote random to roll' })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
      });
    }

    // ─────────────────────────────────────────────
    // RANDOM
    // ─────────────────────────────────────────────
    if (sub === 'random') {
      const quote = getRandomQuote(guildId);
      if (!quote) {
        return interaction.reply({
          content: '🎙️ No quotes saved yet! Add one with `/quote add quote:"..." context:"..."`!',
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎙️ Out of Context Stream Quote')
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(`### "${quote.quote}"\n\n${quote.context ? `📌 *Context: ${quote.context}*\n` : ''}Added by **${quote.authorTag}** on <t:${Math.floor(new Date(quote.createdAt).getTime() / 1000)}:D>`)
        .setFooter({ text: 'ZX Stream Network • Type /quote random for another' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // LIST
    // ─────────────────────────────────────────────
    if (sub === 'list') {
      const quotes = getQuotes(guildId);
      if (quotes.length === 0) {
        return interaction.reply({
          content: '🎙️ No quotes in the archive yet. Use `/quote add` to record the first one!',
          ephemeral: true,
        });
      }

      const recent = quotes.slice(0, 6);
      const fields = recent.map(
        (q, i) => `${i + 1}. **"${q.quote}"**${q.context ? `\n   └ *${q.context}*` : ''}\n   └ *Added by ${q.authorTag}*`
      );

      const embed = new EmbedBuilder()
        .setTitle(`🎙️ Stream Quotes Archive (${quotes.length} total)`)
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(fields.join('\n\n'))
        .setFooter({ text: 'Add your favorite streamer quotes with /quote add' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
