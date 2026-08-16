const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { writeData, readData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));

const LEVELS = {
  1: { name: 'Owner', color: '#FFD700', emoji: '👑' },
  2: { name: 'Admin', color: '#ED4245', emoji: '🛡️' },
  3: { name: 'Moderator', color: '#5865F2', emoji: '⚔️' },
  4: { name: 'Member', color: '#57F287', emoji: '👤' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Manage user levels (Owner, Admin, Moderator, Member)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a user\'s level')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to set the level for')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The level to set (1=Owner, 2=Admin, 3=Moderator, 4=Member)')
            .setRequired(true)
            .addChoices(
              { name: 'Owner (Level 1)', value: 1 },
              { name: 'Admin (Level 2)', value: 2 },
              { name: 'Moderator (Level 3)', value: 3 },
              { name: 'Member (Level 4)', value: 4 }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check a user\'s level')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to check (defaults to you)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all users with their levels')),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (subcommand === 'set') {
      const targetUser = interaction.options.getUser('user');
      const level = interaction.options.getInteger('level');
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.reply({ content: '❌ User not found in this server', ephemeral: true });
      }

      // Load existing levels
      const levels = readData('levels.json') || {};
      
      // Initialize guild levels if not exists
      if (!levels[guild.id]) {
        levels[guild.id] = {};
      }

      // Set the user's level
      levels[guild.id][targetUser.id] = {
        level: level,
        setBy: interaction.user.id,
        setAt: Date.now()
      };

      // Save levels
      writeData('levels.json', levels);

      const levelInfo = LEVELS[level];
      const embed = new EmbedBuilder()
        .setTitle(`${levelInfo.emoji} Level Updated`)
        .setColor(levelInfo.color)
        .setDescription(`**${targetUser.tag}** has been set to **${levelInfo.name}** (Level ${level})`)
        .addFields(
          { name: 'User', value: targetUser.tag, inline: true },
          { name: 'New Level', value: `${levelInfo.emoji} ${levelInfo.name}`, inline: true },
          { name: 'Set by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'check') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        return interaction.reply({ content: '❌ User not found in this server', ephemeral: true });
      }

      // Load levels
      const levels = readData('levels.json') || {};
      const guildLevels = levels[guild.id] || {};
      const userLevelData = guildLevels[targetUser.id];

      let level = 4; // Default to Member
      let isDefault = true;

      if (userLevelData) {
        level = userLevelData.level;
        isDefault = false;
      }

      // Also check by role name as fallback
      if (isDefault) {
        const memberRoles = targetMember.roles.cache.map(role => role.name.toLowerCase());
        if (memberRoles.some(name => name.includes('owner'))) {
          level = 1;
          isDefault = false;
        } else if (memberRoles.some(name => name.includes('admin'))) {
          level = 2;
          isDefault = false;
        } else if (memberRoles.some(name => name.includes('mod') || name.includes('moderator'))) {
          level = 3;
          isDefault = false;
        }
      }

      const levelInfo = LEVELS[level];
      const embed = new EmbedBuilder()
        .setTitle(`${levelInfo.emoji} User Level`)
        .setColor(levelInfo.color)
        .setDescription(`**${targetUser.tag}** is a **${levelInfo.name}** (Level ${level})`)
        .addFields(
          { name: 'User', value: targetUser.tag, inline: true },
          { name: 'Level', value: `${levelInfo.emoji} ${levelInfo.name} (${level})`, inline: true },
          { name: 'Status', value: isDefault ? '🔹 Default (based on roles)' : '✅ Manually set', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'list') {
      // Load levels
      const levels = readData('levels.json') || {};
      const guildLevels = levels[guild.id] || {};

      if (Object.keys(guildLevels).length === 0) {
        return interaction.reply({ 
          content: '❌ No manually set levels found. Users will be assigned levels based on their role names.',
          ephemeral: true 
        });
      }

      // Group users by level
      const levelGroups = {
        1: [],
        2: [],
        3: [],
        4: []
      };

      for (const [userId, levelData] of Object.entries(guildLevels)) {
        const level = levelData.level;
        if (levelGroups[level]) {
          try {
            const user = await interaction.client.users.fetch(userId);
            levelGroups[level].push(user.tag);
          } catch (err) {
            levelGroups[level].push(`Unknown (${userId})`);
          }
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Server Levels')
        .setColor('#5865F2')
        .setDescription('Users with manually assigned levels')
        .setTimestamp();

      for (const [levelNum, users] of Object.entries(levelGroups)) {
        if (users.length > 0) {
          const levelInfo = LEVELS[levelNum];
          embed.addFields({
            name: `${levelInfo.emoji} ${levelInfo.name} (${users.length})`,
            value: users.slice(0, 10).join('\n') + (users.length > 10 ? `\n... and ${users.length - 10} more` : ''),
            inline: true
          });
        }
      }

      await interaction.reply({ embeds: [embed] });
    }
  }
};
