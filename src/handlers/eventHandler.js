const fs = require('fs');
const path = require('path');

/**
 * Recursively loads all event files from src/events/
 * and registers them on the client.
 * @param {import('discord.js').Client} client
 */
function loadEvents(client) {
  const eventsDir = path.join(__dirname, '..', 'events');
  let loaded = 0;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          const event = require(fullPath);
          if (!event.name || !event.execute) {
            console.warn(`[EventHandler] Skipping ${entry.name}: missing name or execute`);
            continue;
          }
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
          } else {
            client.on(event.name, (...args) => event.execute(...args, client));
          }
          loaded++;
        } catch (err) {
          console.error(`[EventHandler] Failed to load ${entry.name}:`, err.message);
        }
      }
    }
  }

  walk(eventsDir);
  console.log(`[EventHandler] Loaded ${loaded} event(s).`);
}

module.exports = { loadEvents };
