const { readData, writeData } = require('./dataStore');

/**
 * Default stream settings
 */
const DEFAULT_STREAM_DATA = {
  socials: {
    twitch: '',
    youtube: '',
    kick: '',
    tiktok: '',
    twitter: '',
    instagram: '',
    discord: '',
  },
  schedule: [],
  streamPingRoleId: null,
  currentLive: null,
};

/**
 * Get stream configuration for a guild.
 * @param {string} guildId 
 * @returns {object}
 */
function getStreamData(guildId) {
  const all = readData('stream.json') || {};
  if (!all[guildId]) {
    all[guildId] = JSON.parse(JSON.stringify(DEFAULT_STREAM_DATA));
  }
  return all[guildId];
}

/**
 * Update stream configuration for a guild.
 * @param {string} guildId 
 * @param {object} updates 
 */
function updateStreamData(guildId, updates) {
  const all = readData('stream.json') || {};
  all[guildId] = {
    ...getStreamData(guildId),
    ...updates,
  };
  writeData('stream.json', all);
  return all[guildId];
}

/**
 * ─────────────────────────────────────────────────────────────
 * Clips Store
 * ─────────────────────────────────────────────────────────────
 */

function getClips(guildId) {
  const all = readData('clips.json') || {};
  return all[guildId] || [];
}

function addClip(guildId, clip) {
  const all = readData('clips.json') || {};
  if (!all[guildId]) all[guildId] = [];
  const newClip = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    ...clip,
  };
  all[guildId].unshift(newClip);
  writeData('clips.json', all);
  return newClip;
}

function getRandomClip(guildId) {
  const list = getClips(guildId);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * ─────────────────────────────────────────────────────────────
 * Quotes Store
 * ─────────────────────────────────────────────────────────────
 */

function getQuotes(guildId) {
  const all = readData('quotes.json') || {};
  return all[guildId] || [];
}

function addQuote(guildId, quoteData) {
  const all = readData('quotes.json') || {};
  if (!all[guildId]) all[guildId] = [];
  const newQuote = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    ...quoteData,
  };
  all[guildId].unshift(newQuote);
  writeData('quotes.json', all);
  return newQuote;
}

function getRandomQuote(guildId) {
  const list = getQuotes(guildId);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * ─────────────────────────────────────────────────────────────
 * Fan Activity & XP Store
 * ─────────────────────────────────────────────────────────────
 */

const xpCooldowns = new Map(); // key: `${guildId}:${userId}`, val: timestamp

function getFanTier(level) {
  if (level >= 50) return { title: '👑 Stream Legend', color: '#FFD700', badge: '👑' };
  if (level >= 25) return { title: '💎 VIP Fan', color: '#9B59B6', badge: '💎' };
  if (level >= 15) return { title: '🥇 Dedicated Fan', color: '#E67E22', badge: '🥇' };
  if (level >= 5) return { title: '🥈 Regular Viewer', color: '#3498DB', badge: '🥈' };
  return { title: '🥉 New Fan', color: '#95A5A6', badge: '🥉' };
}

function calculateLevel(xp) {
  // Level N requires 50 * N^1.5 XP
  let level = 1;
  while (xp >= xpForNextLevel(level)) {
    level++;
  }
  return level;
}

function xpForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.4));
}

function addMessageXp(guildId, userId, userTag) {
  const cooldownKey = `${guildId}:${userId}`;
  const now = Date.now();
  const lastXpTime = xpCooldowns.get(cooldownKey) || 0;

  // 60-second cooldown per XP drop
  if (now - lastXpTime < 60000) {
    return null;
  }
  xpCooldowns.set(cooldownKey, now);

  const allXp = readData('fan_xp.json') || {};
  if (!allXp[guildId]) allXp[guildId] = {};
  if (!allXp[guildId][userId]) {
    allXp[guildId][userId] = {
      tag: userTag,
      xp: 0,
      messages: 0,
      level: 1,
      lastActive: new Date().toISOString(),
    };
  }

  const user = allXp[guildId][userId];
  const oldLevel = user.level || 1;
  const gained = Math.floor(Math.random() * 11) + 15; // 15-25 XP

  user.tag = userTag;
  user.xp += gained;
  user.messages = (user.messages || 0) + 1;
  user.lastActive = new Date().toISOString();

  const newLevel = calculateLevel(user.xp);
  user.level = newLevel;

  writeData('fan_xp.json', allXp);

  if (newLevel > oldLevel) {
    return {
      leveledUp: true,
      oldLevel,
      newLevel,
      tier: getFanTier(newLevel),
      user,
    };
  }

  return { leveledUp: false, user };
}

function getLeaderboard(guildId, limit = 10) {
  const allXp = readData('fan_xp.json') || {};
  const guildUsers = allXp[guildId] || {};

  const sorted = Object.entries(guildUsers)
    .map(([userId, data]) => ({
      userId,
      ...data,
      tier: getFanTier(data.level || 1),
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);

  return sorted;
}

function getUserRank(guildId, userId) {
  const allXp = readData('fan_xp.json') || {};
  const guildUsers = allXp[guildId] || {};

  const sorted = Object.entries(guildUsers)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.xp - a.xp);

  const rankIndex = sorted.findIndex((u) => u.id === userId);
  const userData = guildUsers[userId] || {
    xp: 0,
    messages: 0,
    level: 1,
  };

  return {
    rank: rankIndex !== -1 ? rankIndex + 1 : sorted.length + 1,
    total: sorted.length,
    level: userData.level || 1,
    xp: userData.xp || 0,
    nextLevelXp: xpForNextLevel(userData.level || 1),
    messages: userData.messages || 0,
    tier: getFanTier(userData.level || 1),
  };
}

module.exports = {
  getStreamData,
  updateStreamData,
  getClips,
  addClip,
  getRandomClip,
  getQuotes,
  addQuote,
  getRandomQuote,
  addMessageXp,
  getLeaderboard,
  getUserRank,
  getFanTier,
  xpForNextLevel,
};
