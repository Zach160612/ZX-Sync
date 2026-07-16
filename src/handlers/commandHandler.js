const fs = require('fs');
const path = require('path');

/**
 * Recursively loads all command files from src/commands/
 * and registers them on client.commands.
 * @param {import('discord.js').Client} client
 */
function loadCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  let loaded = 0;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          const command = require(fullPath);
          if (!command.data || !command.execute) {
            console.warn(`[CommandHandler] Skipping ${entry.name}: missing data or execute`);
            continue;
          }
          client.commands.set(command.data.name, command);
          loaded++;
        } catch (err) {
          console.error(`[CommandHandler] Failed to load ${entry.name}:`, err.message);
        }
      }
    }
  }

  walk(commandsDir);
  console.log(`[CommandHandler] Loaded ${loaded} command(s).`);
}

module.exports = { loadCommands };
