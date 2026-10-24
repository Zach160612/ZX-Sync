const { Events, EmbedBuilder } = require('discord.js');
const path = require('path');
const { addMessageXp } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

module.exports = {
  name: Events.MessageCreate,

  async execute(message, client) {
    // Ignore bots and direct messages
    if (!message.guild || message.author.bot) return;

    console.log(`[Message] From ${message.author.tag} in #${message.channel.name}: "${message.content}"`);
    const content = message.content.trim().toLowerCase();

    // ─── 1. Helpful tip for prefix commands (!help, !ping, !live, etc.) ───
    if (content.startsWith('!') || content.startsWith('?')) {
      const knownCommands = ['help', 'ping', 'live', 'stream', 'socials', 'schedule', 'topic', 'hype', 'trivia', 'leaderboard', 'rank', 'clip', 'quote'];
      const cmd = content.slice(1).split(/\s+/)[0];
      if (knownCommands.includes(cmd)) {
        const hint = await message.reply({
          content: `💡 Hey <@${message.author.id}>, ZX Sync uses Discord's modern **slash commands**! Type \`/${cmd}\` instead! 🚀`,
        }).catch(() => null);

        // Clean up hint after 8 seconds so chat stays clean
        if (hint) {
          setTimeout(() => hint.delete().catch(() => null), 8000);
        }
      }
    }

    // ─── 2. Fan Chat Activity & Leveling ───
    try {
      const result = addMessageXp(message.guild.id, message.author.id, message.author.username);

      if (result && result.leveledUp) {
        // Send cheerful level up message
        const levelEmbed = new EmbedBuilder()
          .setTitle(`🌟 LEVEL UP! — ${result.tier.badge} Level ${result.newLevel}`)
          .setColor(result.tier.color || '#FFD700')
          .setDescription(
            `GG <@${message.author.id}>! You just reached **Level ${result.newLevel}** in the stream community!\n` +
              `You are now a **${result.tier.title}**! 🚀 Keep chatting to climb the \`/leaderboard\`!`
          )
          .setFooter({ text: 'ZX Sync Fan Progression' });

        await message.channel.send({ embeds: [levelEmbed] }).catch(() => null);
      }
    } catch (err) {
      console.error('[MessageCreate XP Error]', err.message);
    }
  },
};
