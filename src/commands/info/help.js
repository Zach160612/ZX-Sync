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
    ],
    staffOnly: true,
  },
  {
    name: '🎭 Role Management',
    commands: [
      { name: '/role create', description: 'Create a new role' },
      { name: '/role delete', description: 'Delete a role' },
      { name: '/role color', description: 'Change a role\'s color' },
      { name: '/role give', description: 'Give a role to a member' },
      { name: '/role remove', description: 'Remove a role from a member' },
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
      { name: '/poll', description: 'Create a poll' },
      { name: '/giveaway', description: 'Start a giveaway' },
      { name: '/embed', description: 'Build a custom embed announcement' },
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
