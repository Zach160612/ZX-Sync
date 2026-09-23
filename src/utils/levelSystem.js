const { readData } = require('./dataStore.js');

const LEVELS = {
  1: { name: 'Owner', color: '#FFD700', emoji: '👑' },
  2: { name: 'Admin', color: '#ED4245', emoji: '🛡️' },
  3: { name: 'Moderator', color: '#5865F2', emoji: '⚔️' },
  4: { name: 'Member', color: '#57F287', emoji: '👤' }
};

/**
 * Get a user's level based on manual assignment or role names
 * @param {import('discord.js').GuildMember} member 
 * @returns {number} Level (1-4)
 */
function getUserLevel(member) {
  const guild = member.guild;
  
  // Server owner is ALWAYS level 1 (Owner)
  if (guild.ownerId === member.id) {
    return 1;
  }
  
  // Check manual assignment first
  const levels = readData('levels.json') || {};
  const guildLevels = levels[guild.id] || {};
  const userLevelData = guildLevels[member.id];
  
  if (userLevelData) {
    return userLevelData.level;
  }

  // Fallback to role name detection
  const memberRoles = member.roles.cache.map(role => role.name.toLowerCase());
  
  if (memberRoles.some(name => name.includes('owner'))) {
    return 1;
  } else if (memberRoles.some(name => name.includes('admin'))) {
    return 2;
  } else if (memberRoles.some(name => name.includes('mod') || name.includes('moderator'))) {
    return 3;
  }

  // Default to member
  return 4;
}

/**
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function hasManualLevelAssignment(member) {
  const levels = readData('levels.json') || {};
  const guildLevels = levels[member.guild.id] || {};
  return Boolean(guildLevels[member.id]);
}

/**
 * Get level information for a specific level number
 * @param {number} level 
 * @returns {object} Level information
 */
function getLevelInfo(level) {
  return LEVELS[level] || LEVELS[4];
}

/**
 * Check if a user has at least a specific level
 * @param {import('discord.js').GuildMember} member 
 * @param {number} requiredLevel 
 * @returns {boolean}
 */
function hasLevel(member, requiredLevel) {
  const userLevel = getUserLevel(member);
  return userLevel <= requiredLevel; // Lower level number = higher permission
}

/**
 * Format a user's display name with their level emoji
 * @param {import('discord.js').GuildMember} member 
 * @returns {string}
 */
function formatUserWithLevel(member) {
  const level = getUserLevel(member);
  const levelInfo = getLevelInfo(level);
  return `${levelInfo.emoji} ${member.displayName}`;
}

module.exports = {
  getUserLevel,
  getLevelInfo,
  hasLevel,
  formatUserWithLevel,
  hasManualLevelAssignment,
  LEVELS
};
