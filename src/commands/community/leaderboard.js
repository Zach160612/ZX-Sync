const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const path = require('path');
const {
  getUserRank,
  getLeaderboard,
  xpForNextLevel,
} = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

function getProgressBar(current, target, totalBars = 12) {
  const ratio = Math.min(1, Math.max(0, current / target));
  const filled = Math.round(ratio * totalBars);
  const empty = totalBars - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View top active fans and check your community chat rank.')
    .addSubcommand((sub) =>
      sub
        .setName('top')
        .setDescription('View the Top 10 most active fans in the community')
    )
    .addSubcommand((sub) =>
      sub
        .setName('rank')
        .setDescription('Check your fan tier, level, and chat activity rank')
        .addUserOption((opt) =>
          opt
            .setName('user')
            .setDescription('User to check rank for (leave empty for yourself)')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ─────────────────────────────────────────────
    // TOP LEADERBOARD
    // ─────────────────────────────────────────────
    if (sub === 'top') {
      const topList = getLeaderboard(guildId, 10);

      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${interaction.guild.name} — Top Fan Leaderboard`)
        .setColor('#FFD700')
        .setDescription('The most active and dedicated fans in our stream community! Chat to earn XP and level up!')
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || interaction.client.user.displayAvatarURL())
        .setFooter({ text: 'ZX Stream Community • Chat to climb the leaderboard!' })
        .setTimestamp();

      if (topList.length === 0) {
        embed.addFields({
          name: 'Leaderboard Empty',
          value: 'Start chatting in the server to be the first on the leaderboard! 🚀',
        });
        return interaction.reply({ embeds: [embed] });
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      const entries = topList.map((entry, idx) => {
        const medal = medals[idx] || `\`#${idx + 1}\``;
        return `${medal} **${entry.tag}** — **Level ${entry.level || 1}** (${entry.tier.title})\n   └ \`${entry.xp || 0} XP\` • \`${entry.messages || 0} msgs\``;
      });

      embed.addFields({
        name: '👑 Top Community Chatters',
        value: entries.join('\n\n'),
      });

      return interaction.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // RANK
    // ─────────────────────────────────────────────
    if (sub === 'rank') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const rankData = getUserRank(guildId, targetUser.id);

      const prevLevelXp = rankData.level > 1 ? xpForNextLevel(rankData.level - 1) : 0;
      const currentLevelProgress = rankData.xp - prevLevelXp;
      const neededForNext = rankData.nextLevelXp - prevLevelXp;
      const bar = getProgressBar(currentLevelProgress, neededForNext);

      const embed = new EmbedBuilder()
        .setTitle(`📊 Fan Rank: ${targetUser.username}`)
        .setColor(rankData.tier.color || '#5865F2')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`Current Tier: **${rankData.tier.title}**`)
        .addFields(
          { name: '🏆 Server Rank', value: `#${rankData.rank} of ${rankData.total || 1}`, inline: true },
          { name: '⭐ Level', value: `Level ${rankData.level}`, inline: true },
          { name: '💬 Total Messages', value: `${rankData.messages} msgs`, inline: true },
          {
            name: `Progress to Level ${rankData.level + 1}`,
            value: `\`[${bar}]\` **${rankData.xp}** / ${rankData.nextLevelXp} XP`,
            inline: false,
          }
        )
        .setFooter({ text: 'Earn XP by chatting in the server & participating in trivia!' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
