require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// Attach collections to the client
client.commands = new Collection();
client.events = new Collection();
client.cooldowns = new Collection();

// Load handlers
loadCommands(client);
loadEvents(client);

// Log in
client.login(process.env.BOT_TOKEN).catch((err) => {
  console.error('❌ Failed to login:', err.message);
  process.exit(1);
});

// Simple web server to bind to a port for Render.com free hosting compatibility
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ZX Sync is active and online!');
}).listen(PORT, () => {
  console.log(`[Web Server] Web server listening on port ${PORT}`);
});
