const { PermissionFlagsBits } = require('discord.js');

/**
 * Commands any server member can use.
 * Use `true` for whole commands, or an array of subcommand names for mixed commands.
 */
const PUBLIC_COMMANDS = {
  help: true,
  info: true,
  ping: true,
  roles: ['get'],
  socials: true,
  schedule: true,
  streamping: true,
  topic: true,
  hype: true,
  trivia: true,
  clip: ['submit', 'random', 'list'],
  quote: ['add', 'random', 'list'],
  leaderboard: ['top', 'rank'],
};

/** Discord permission required to see staff commands in the slash picker */
const STAFF_DEFAULT_PERMISSIONS = PermissionFlagsBits.ModerateMembers;

/**
 * @param {string} commandName
 * @param {string|null|undefined} subcommand
 * @returns {boolean}
 */
function isPublicCommand(commandName, subcommand) {
  const entry = PUBLIC_COMMANDS[commandName];
  if (entry === true) return true;
  if (Array.isArray(entry)) return subcommand ? entry.includes(subcommand) : false;
  return false;
}

/**
 * Apply Discord-level visibility restrictions when deploying global commands.
 * @param {object} commandJson
 * @returns {object}
 */
function applyDeployPermissions(commandJson) {
  const entry = PUBLIC_COMMANDS[commandJson.name];

  // Fully public commands or commands with public subcommands stay visible to everyone
  if (entry === true || Array.isArray(entry)) return commandJson;

  // /roles has a public subcommand — keep visible; runtime checks handle /roles panel
  if (commandJson.name === 'roles') return commandJson;

  commandJson.default_member_permissions = String(STAFF_DEFAULT_PERMISSIONS);
  return commandJson;
}

module.exports = {
  PUBLIC_COMMANDS,
  STAFF_DEFAULT_PERMISSIONS,
  isPublicCommand,
  applyDeployPermissions,
};
