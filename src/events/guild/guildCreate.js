const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildCreate,
  once: false,

  async execute(guild) {
    console.log(`[GuildJoin] Bot joined guild: ${guild.name} (ID: ${guild.id})`);
    
    // Ensure bot shows online in the new guild
    try {
      guild.client.user.setPresence({
        status: 'online',
        activities: [{ name: '/help | ZX Sync', type: 0 }],
      });
      console.log(`[Presence] Updated presence for new guild: ${guild.name}`);
    } catch (err) {
      console.error(`[Presence] Failed to update presence for ${guild.name}:`, err.message);
    }
  }
};
