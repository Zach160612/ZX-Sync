const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { generateWelcomeImage } = require(path.join(__dirname, '..', '..', 'utils', 'welcomeImage.js'));
const { getActivities } = require(path.join(__dirname, '..', '..', 'utils', 'activityLogger.js'));
const { readData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const config = require('../../../config.json');

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

/**
 * Run a single test and return a result line.
 */
async function runTest(label, fn) {
  try {
    const result = await fn();
    if (result === true) return `${PASS} **${label}**`;
    if (result === false) return `${FAIL} **${label}**`;
    // String = warning/detail
    return `${WARN} **${label}** — ${result}`;
  } catch (err) {
    return `${FAIL} **${label}** — \`${err.message}\``;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Run a full health check on all bot systems (Staff only).'),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const botMember = guild.members.me;
    const results = [];

    // ─── 1. Bot online & responding ───────────────────────────────
    results.push(await runTest('Bot online & responding', () => true));

    // ─── 2. Bot has Administrator or key permissions ───────────────
    results.push(await runTest('Bot has required permissions', () => {
      if (botMember.permissions.has(PermissionFlagsBits.Administrator)) return true;
      const needed = [
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
      ];
      const missing = needed.filter((p) => !botMember.permissions.has(p));
      if (missing.length === 0) return true;
      return `Missing ${missing.length} permission(s)`;
    }));

    // ─── 3. Bot role position (hierarchy check) ────────────────────
    results.push(await runTest('Bot role is high enough to manage members', () => {
      const highestRole = guild.roles.cache
        .filter((r) => !r.managed && r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .first();
      if (!highestRole) return true;
      const botHighest = botMember.roles.highest;
      if (botHighest.position > highestRole.position) return true;
      return `Bot's highest role (${botHighest.name}) is below ${highestRole.name} — move bot role higher`;
    }));

    // ─── 4. Welcome channel ────────────────────────────────────────
    results.push(await runTest('Welcome channel configured', () => {
      const id = config.channels?.welcome;
      if (!id) return 'Not set — use /welcome to set it';
      const ch = guild.channels.cache.get(id);
      if (!ch) return `Channel ID ${id} not found in server`;
      if (!botMember.permissionsIn(ch).has(PermissionFlagsBits.SendMessages)) return `Can't send messages in #${ch.name}`;
      return true;
    }));

    // ─── 5. Goodbye channel ────────────────────────────────────────
    results.push(await runTest('Goodbye channel configured', () => {
      const id = config.channels?.goodbye;
      if (!id) return 'Not set — use /goodbye to set it';
      const ch = guild.channels.cache.get(id);
      if (!ch) return `Channel ID ${id} not found in server`;
      if (!botMember.permissionsIn(ch).has(PermissionFlagsBits.SendMessages)) return `Can't send messages in #${ch.name}`;
      return true;
    }));

    // ─── 6. Log channel ────────────────────────────────────────────
    results.push(await runTest('Log/audit channel configured', () => {
      const id = config.channels?.log;
      if (!id || id === 'LOG_CHANNEL_ID_HERE') return 'Not set — configure config.channels.log';
      const ch = guild.channels.cache.get(id);
      if (!ch) return `Log channel ID ${id} not found`;
      return true;
    }));

    // ─── 7. Welcome image generation ──────────────────────────────
    results.push(await runTest('Welcome image generator', async () => {
      const dummyMember = {
        user: {
          username: 'TestUser',
          displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
        },
        guild: { memberCount: guild.memberCount },
      };
      const buf = await generateWelcomeImage(dummyMember, guild.name);
      if (!buf || buf.length < 1000) return 'Image generated but looks too small';
      return true;
    }));

    // ─── 8. Activity logger read ───────────────────────────────────
    results.push(await runTest('Activity logger readable', () => {
      const logs = getActivities({ limit: 1 });
      if (Array.isArray(logs)) return true;
      return 'Unexpected return type from activity logger';
    }));

    // ─── 9. Data store (tickets) ───────────────────────────────────
    results.push(await runTest('Data store accessible', () => {
      const tickets = readData('tickets.json');
      if (typeof tickets === 'object') return true;
      return 'Unexpected data from tickets store';
    }));

    // ─── 10. Auto-roles ────────────────────────────────────────────
    results.push(await runTest('Auto-role config valid', () => {
      const autoRoles = readData('autoroles.json');
      const roleIds = autoRoles[guild.id] || [];
      if (!Array.isArray(roleIds) || roleIds.length === 0) return 'No auto-roles set — use /autorole add to configure';
      const invalid = roleIds.filter((id) => !guild.roles.cache.has(id));
      if (invalid.length > 0) return `${invalid.length} auto-role(s) no longer exist in the server`;
      return `${roleIds.length} auto-role(s) configured and valid`;
    }));

    // ─── 11. Self-assignable roles ────────────────────────────────
    results.push(await runTest('Self-assignable roles available', () => {
      const normalRoles = guild.roles.cache.filter((role) => {
        if (role.id === guild.id) return false;
        if (role.managed) return false;
        const low = role.name.toLowerCase();
        const blocked = ['admin', 'owner', 'mod', 'staff', 'clanker', 'bot', 'system', 'custom'];
        if (blocked.some((k) => low.includes(k))) return false;
        if (role.name.includes('⭐') || role.name.includes('✨')) return false;
        const perms = role.permissions;
        if (
          perms.has(PermissionFlagsBits.Administrator) ||
          perms.has(PermissionFlagsBits.ManageGuild) ||
          perms.has(PermissionFlagsBits.BanMembers) ||
          perms.has(PermissionFlagsBits.KickMembers) ||
          perms.has(PermissionFlagsBits.ManageRoles) ||
          perms.has(PermissionFlagsBits.ManageChannels)
        ) return false;
        return true;
      });
      if (normalRoles.size === 0) return 'No self-assignable roles found — create roles for /roles panel';
      return `${normalRoles.size} role(s) visible in /roles`;
    }));

    // ─── 12. Bot can send embeds ───────────────────────────────────
    results.push(await runTest('Bot can send embeds in this channel', () => {
      const perms = botMember.permissionsIn(interaction.channel);
      if (!perms.has(PermissionFlagsBits.SendMessages)) return 'Missing SendMessages';
      if (!perms.has(PermissionFlagsBits.EmbedLinks)) return 'Missing EmbedLinks';
      if (!perms.has(PermissionFlagsBits.AttachFiles)) return 'Missing AttachFiles';
      return true;
    }));

    // ─── 13. Command count ────────────────────────────────────────
    results.push(await runTest('All commands registered', () => {
      const count = interaction.client.commands?.size || 0;
      if (count === 0) return 'No commands found in client cache';
      return `${count} command(s) registered`;
    }));

    // ─── Build summary embed ──────────────────────────────────────
    const passed = results.filter((r) => r.startsWith(PASS)).length;
    const warned = results.filter((r) => r.startsWith(WARN)).length;
    const failed = results.filter((r) => r.startsWith(FAIL)).length;
    const total = results.length;

    let statusColor = config.color.success || '#57F287';
    let statusTitle = '✅ All Systems Operational';
    if (failed > 0) { statusColor = config.color.error || '#ED4245'; statusTitle = `❌ ${failed} System(s) Failed`; }
    else if (warned > 0) { statusColor = config.color.warning || '#FEE75C'; statusTitle = `⚠️ ${warned} Warning(s) Found`; }

    const embed = new EmbedBuilder()
      .setTitle(`🔧 ZX Sync — System Health Check`)
      .setColor(statusColor)
      .setDescription(results.join('\n'))
      .addFields({
        name: '📊 Summary',
        value: `${PASS} Passed: **${passed}** · ${WARN} Warnings: **${warned}** · ${FAIL} Failed: **${failed}** · Total: **${total}**`,
      })
      .setFooter({ text: statusTitle })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
