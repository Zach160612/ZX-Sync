const { Events } = require('discord.js');
const { readData, writeData } = require('../../utils/dataStore');
const { endGiveaway } = require('../../commands/giveaways/giveaway');
const { scheduleReminders } = require('../../commands/events/event');
const config = require('../../../config.json');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`\n✅ ${client.user.tag} is online and ready!`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)\n`);

    client.user.setPresence({
      status: 'online',
      activities: [{ name: '/help | ZX Sync', type: 0 }],
    });

    // ── Restore pending giveaway timers ──
    const giveaways = readData('giveaways.json');
    let restoredGiveaways = 0;
    for (const g of giveaways) {
      if (g.ended) continue;
      const remaining = new Date(g.endsAt).getTime() - Date.now();
      if (remaining <= 0) {
        // Should have already ended — end now
        await endGiveaway(client, g).catch(console.error);
      } else {
        setTimeout(() => endGiveaway(client, g), remaining);
        restoredGiveaways++;
      }
    }
    if (restoredGiveaways > 0) {
      console.log(`[Ready] Restored ${restoredGiveaways} giveaway timer(s).`);
    }

    // ── Restore pending event reminders ──
    const events = readData('events.json');
    let restoredEvents = 0;
    for (const event of events) {
      if (new Date(event.timestamp).getTime() > Date.now()) {
        scheduleReminders(client, event);
        restoredEvents++;
      }
    }
    if (restoredEvents > 0) {
      console.log(`[Ready] Restored reminders for ${restoredEvents} event(s).`);
    }
  },
};
