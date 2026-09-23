require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { applyDeployPermissions } = require('./src/utils/commandAccess');

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
        commands.push(applyDeployPermissions(command.data.toJSON()));
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
    console.log(`\n🚀 Deploying ${commands.length} slash command(s) globally to all servers...`);
    console.log('⚠️  Note: Global commands can take up to 1 hour to propagate to all servers');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Successfully deployed all slash commands globally!');
    console.log('💡 Commands will appear in all servers the bot is invited to');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
})();
