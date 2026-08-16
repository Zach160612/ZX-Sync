const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { getUserLevel, getLevelInfo } = require(path.join(__dirname, '..', '..', 'utils', 'levelSystem.js'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelsync')
    .setDescription('Sync all member nicknames with their level emojis (Staff only)'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const members = await guild.members.fetch();
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const [memberId, member] of members) {
      if (member.user.bot) continue; // Skip bots
      if (!member.manageable) {
        failed++;
        continue;
      }

      try {
        const level = getUserLevel(member);
        const levelInfo = getLevelInfo(level);
        const currentNick = member.nickname || member.user.username;
        
        // Remove existing level emojis from nickname
        const emojiPattern = /[👑🛡️⚔️👤]/g;
        const cleanNick = currentNick.replace(emojiPattern, '').trim();
        
        // Add level emoji to the beginning
        const newNick = `${levelInfo.emoji} ${cleanNick}`;
        
        // Only update if different
        if (newNick !== currentNick) {
          await member.setNickname(newNick);
          updated++;
        }
      } catch (err) {
        failed++;
        if (errors.length < 5) {
          errors.push(`${member.user.tag}: ${err.message}`);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🔄 Level Sync Complete')
      .setColor(updated > 0 ? '#57F287' : '#FEE75C')
      .setDescription(`Updated nicknames for ${updated} members`)
      .addFields(
        { name: '✅ Updated', value: updated.toString(), inline: true },
        { name: '❌ Failed', value: failed.toString(), inline: true },
        { name: '👥 Total', value: members.size.toString(), inline: true }
      )
      .setTimestamp();

    if (errors.length > 0) {
      embed.addFields({
        name: '⚠️ Sample Errors',
        value: errors.join('\n'),
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};
