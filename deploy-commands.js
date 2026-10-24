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
    const guilds = await rest.get(Routes.userGuilds());
    console.log(`\n🚀 Deploying ${commands.length} slash command(s) to ${guilds.length} guild(s)...`);

    for (const guild of guilds) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
          { body: commands }
        );
        console.log(`  ✅ Successfully deployed to guild: ${guild.name} (${guild.id})`);
      } catch (guildErr) {
        console.error(`  ❌ Failed to deploy to guild: ${guild.name} (${guild.id}):`, guildErr.message);
      }
    }

    console.log('\n🎉 Successfully deployed all slash commands to all servers instantly!');
  } catch (error) {
    console.error('❌ Failed to fetch guilds or deploy commands:', error);
  }
})();
