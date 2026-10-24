const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission: checkPerm } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const config = require('../../../config.json');

const CATEGORIES = [
  {
    name: '📋 Information',
    commands: [
      { name: '/help', description: 'Show this help menu' },
      { name: '/info', description: 'Display bot information' },
      { name: '/ping', description: 'Check bot latency' },
    ],
    staffOnly: false,
  },
  {
    name: '📡 Streaming & Creator Hub',
    commands: [
      { name: '/socials', description: 'View creator stream links and social media channels' },
      { name: '/schedule', description: 'View weekly streaming schedule and planned games' },
      { name: '/streamping', description: 'Toggle the @Stream Alerts notification role' },
      { name: '/live', description: 'Announce going live with interactive watch party buttons (Staff)' },
      { name: '/stream setlink', description: 'Save default links for Twitch, YouTube, Kick, etc. (Staff)' },
      { name: '/stream setschedule', description: 'Set weekly stream days and times (Staff)' },
      { name: '/stream setrole', description: 'Configure stream notification role (Staff)' },
      { name: '/stream shoutout', description: 'Shout out fellow streamers and raid targets (Staff)' },
    ],
    staffOnly: false,
  },
  {
    name: '🎉 Community & Chat Revivers',
    commands: [
      { name: '/topic', description: 'Revive dry chat with gamer debates, hot takes & questions' },
      { name: '/hype', description: 'Launch a 45-second interactive Community Hype Train' },
      { name: '/trivia', description: 'Play a 25-second gaming & stream trivia challenge' },
      { name: '/leaderboard top', description: 'View Top 10 most active fans in the community' },
      { name: '/leaderboard rank', description: 'Check your personal fan tier, level, and XP rank' },
      { name: '/clip submit/random/list', description: 'Submit and watch community stream clips' },
      { name: '/quote add/random/list', description: 'Save and roll funny out-of-context stream quotes' },
      { name: '/roles get', description: 'Pick community roles for yourself' },
    ],
    staffOnly: false,
  },
  {
    name: '🔨 Moderation',
    commands: [
      { name: '/ban', description: 'Ban a member from the server' },
      { name: '/kick', description: 'Kick a member from the server' },
      { name: '/warn', description: 'Warn a member' },
      { name: '/warnings', description: 'View warnings for a member' },
      { name: '/timeout', description: 'Timeout a member' },
      { name: '/purge', description: 'Bulk delete messages' },
      { name: '/lock', description: 'Lock a channel' },
      { name: '/unlock', description: 'Unlock a channel' },
      { name: '/name set', description: 'Change a member\'s nickname to bold font (e.g., 𝐙𝐚𝐜𝐡)' },
      { name: '/name pending', description: 'List members who haven\'t gotten the bold font yet' },
      { name: '/logs', description: 'View activity logs (joins, leaves, kicks, bans, warns)' },
    ],
    staffOnly: true,
  },
  {
    name: '🎭 Role Management',
    commands: [
      { name: '/role create', description: 'Create a new role (optionally assign to user)' },
      { name: '/role delete', description: 'Delete a role' },
      { name: '/role remove', description: 'Remove a role from a member' },
      { name: '/autorole add', description: 'Add a role to auto-assign on join' },
      { name: '/autorole remove', description: 'Remove a role from auto-assign' },
      { name: '/autorole list', description: 'List all auto-assigned roles' },
      { name: '/roles panel', description: 'Post self-role dropdown panel in channel' },
    ],
    staffOnly: true,
  },
  {
    name: '📅 Events',
    commands: [
      { name: '/event create', description: 'Create a new event' },
      { name: '/event edit', description: 'Edit an existing event' },
      { name: '/event delete', description: 'Delete an event' },
      { name: '/events', description: 'List all upcoming events' },
    ],
    staffOnly: true,
  },
  {
    name: '🎫 Tickets',
    commands: [
      { name: '/ticket setup', description: 'Create a ticket panel' },
      { name: '/ticket close', description: 'Close the current ticket' },
      { name: '/ticket transcript', description: 'Export ticket as HTML' },
    ],
    staffOnly: true,
  },
  {
    name: '🛠️ Utilities',
    commands: [
      { name: '/customrole', description: 'Request a custom role in your own name and color' },
      { name: '/poll', description: 'Create a poll' },
      { name: '/giveaway', description: 'Start a giveaway' },
      { name: '/embed', description: 'Build a custom embed announcement' },
      { name: '/template', description: 'Apply a server structure template (Gaming, School, Roleplay, Work)' },
      { name: '/welcome', description: 'Configure welcome channel, custom background image, format & message' },
      { name: '/goodbye', description: 'Configure goodbye channel, custom background image, format & message' },
      { name: '/testwelcome', description: 'Test & preview welcome banner card' },
      { name: '/testgoodbye', description: 'Test & preview goodbye banner card' },
    ],
    staffOnly: true,
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands.'),

  async execute(interaction) {
    const isStaff = checkPerm(interaction.member);

    const embed = new EmbedBuilder()
      .setTitle('📖 ZX Sync — Help Menu')
      .setColor(config.color.primary)
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .setDescription('Here are all the commands available to you:')
      .setFooter({ text: `${config.botName} v${config.version}` })
      .setTimestamp();

    for (const category of CATEGORIES) {
      if (category.staffOnly && !isStaff) continue;

      const commandList = category.commands
        .map((c) => `\`${c.name}\` — ${c.description}`)
        .join('\n');

      embed.addFields({ name: category.name, value: commandList });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
