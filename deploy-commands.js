require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// Recursively load all command files
function loadCommandFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommandFiles(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`  ✅ Loaded: ${command.data.name}`);
      }
    }
  }
}

console.log('📦 Loading commands...');
loadCommandFiles(path.join(__dirname, 'src', 'commands'));

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Deploying ${commands.length} slash command(s) to guild ${process.env.GUILD_ID}...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Successfully deployed all slash commands!');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
})();
