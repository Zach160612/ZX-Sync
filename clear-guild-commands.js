require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('🗑️ Clearing guild commands...');
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: [] }
    );
    
    console.log('✅ Successfully cleared guild commands');
    console.log('📝 Only global commands will remain (deployed via deploy-global.js)');
  } catch (error) {
    console.error('❌ Failed to clear guild commands:', error);
  }
})();
