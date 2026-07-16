const { Events, AuditLogEvent } = require('discord.js');
const { logAction, buildLogEmbed } = require('../../utils/logger');
const config = require('../../../config.json');

// Map Discord audit log event types to readable labels
const LOG_MAP = {
  [AuditLogEvent.MemberRoleUpdate]: {
    title: '🎭 Member Roles Updated',
    color: config.color.info,
  },
  [AuditLogEvent.MemberUpdate]: {
    title: '📝 Member Updated',
    color: config.color.warning,
  },
  [AuditLogEvent.ChannelCreate]: {
    title: '📢 Channel Created',
    color: config.color.success,
  },
  [AuditLogEvent.ChannelDelete]: {
    title: '🗑️ Channel Deleted',
    color: config.color.error,
  },
};

module.exports = {
  name: Events.GuildAuditLogEntryCreate,

  async execute(auditLogEntry, guild, client) {
    const { action, executor, target, changes, reason } = auditLogEntry;

    const logDef = LOG_MAP[action];
    if (!logDef) return; // Not a tracked event

    const executorTag = executor ? `${executor.tag} (${executor.id})` : 'Unknown';

    // ── Member Role Update ──
    if (action === AuditLogEvent.MemberRoleUpdate) {
      const added = changes?.filter((c) => c.key === '$add').flatMap((c) => c.new ?? []);
      const removed = changes?.filter((c) => c.key === '$remove').flatMap((c) => c.new ?? []);

      const addedList = added.map((r) => `<@&${r.id}>`).join(', ') || 'None';
      const removedList = removed.map((r) => `<@&${r.id}>`).join(', ') || 'None';

      return logAction(client, buildLogEmbed({
        title: logDef.title,
        color: logDef.color,
        description: `Roles changed for ${target ? `<@${target.id}>` : 'Unknown User'}.`,
        fields: [
          { name: 'User', value: target ? `<@${target.id}>` : 'Unknown', inline: true },
          { name: 'Moderator', value: executorTag, inline: true },
          { name: '✅ Added', value: addedList, inline: false },
          { name: '❌ Removed', value: removedList, inline: false },
        ],
      }));
    }

    // ── Member Update (nickname changes) ──
    if (action === AuditLogEvent.MemberUpdate) {
      const nicknameChange = changes?.find((c) => c.key === 'nick');
      if (!nicknameChange) return;

      return logAction(client, buildLogEmbed({
        title: '📝 Nickname Changed',
        color: logDef.color,
        description: `Nickname updated for ${target ? `<@${target.id}>` : 'Unknown User'}.`,
        fields: [
          { name: 'User', value: target ? `<@${target.id}>` : 'Unknown', inline: true },
          { name: 'Moderator', value: executorTag, inline: true },
          { name: 'Old Nickname', value: nicknameChange.old || '*None*', inline: false },
          { name: 'New Nickname', value: nicknameChange.new || '*None*', inline: false },
        ],
      }));
    }

    // ── Channel Create / Delete ──
    if (action === AuditLogEvent.ChannelCreate || action === AuditLogEvent.ChannelDelete) {
      return logAction(client, buildLogEmbed({
        title: logDef.title,
        color: logDef.color,
        description: `A channel was ${action === AuditLogEvent.ChannelCreate ? 'created' : 'deleted'}.`,
        fields: [
          { name: 'Channel', value: target?.name ? `#${target.name}` : 'Unknown', inline: true },
          { name: 'By', value: executorTag, inline: true },
          reason ? { name: 'Reason', value: reason, inline: false } : null,
        ].filter(Boolean),
      }));
    }
  },
};
