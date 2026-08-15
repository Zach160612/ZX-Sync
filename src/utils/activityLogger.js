const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'activity.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readActivityData() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading activity log:', err.message);
    return [];
  }
}

function writeActivityData(data) {
  try {
    // Keep max 500 entries
    const trimmed = data.slice(0, 500);
    fs.writeFileSync(FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing activity log:', err.message);
  }
}

/**
 * Record a new activity entry.
 * @param {Object} options
 * @param {'JOIN'|'LEAVE'|'KICK'|'BAN'|'WARN'|'TIMEOUT'} options.type
 * @param {Object} options.user { id, tag, username }
 * @param {Object} [options.moderator] { id, tag, username }
 * @param {string} [options.reason]
 * @param {string} [options.details]
 */
function logActivity({ type, user, moderator, reason, details }) {
  const activities = readActivityData();

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    type, // 'JOIN', 'LEAVE', 'KICK', 'BAN', 'WARN', 'TIMEOUT'
    timestamp: Date.now(),
    user: user ? { id: user.id, tag: user.tag || user.username || 'Unknown' } : null,
    moderator: moderator ? { id: moderator.id, tag: moderator.tag || moderator.username || 'System' } : null,
    reason: reason || null,
    details: details || null,
  };

  activities.unshift(entry); // Newest first
  writeActivityData(activities);
  return entry;
}

/**
 * Fetch activities with optional filtering.
 */
function getActivities({ limit = 15, type = null, userId = null } = {}) {
  let activities = readActivityData();

  if (type) {
    activities = activities.filter((a) => a.type.toUpperCase() === type.toUpperCase());
  }

  if (userId) {
    activities = activities.filter((a) => a.user && a.user.id === userId);
  }

  return activities.slice(0, limit);
}

function clearActivities() {
  writeActivityData([]);
}

module.exports = {
  logActivity,
  getActivities,
  clearActivities,
};
