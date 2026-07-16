const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const config = require('../../../config.json');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Display information about ZX Sync.'),

  async execute(interaction) {
    const client = interaction.client;
    const uptime = formatUptime(client.uptime);
    const ping = Math.round(client.ws.ping);
    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    const embed = new EmbedBuilder()
      .setTitle(`${config.botName} — Bot Information`)
      .setColor(config.color.primary)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🤖 Bot Name', value: config.botName, inline: true },
        { name: '📦 Version', value: `v${config.version}`, inline: true },
        { name: '👤 Developer', value: config.developer, inline: true },
        { name: '📡 Ping', value: `${ping}ms`, inline: true },
        { name: '⏱️ Uptime', value: uptime, inline: true },
        { name: '🛠️ Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '🌐 Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 Users', value: `${totalUsers.toLocaleString()}`, inline: true },
        { name: '🟢 Status', value: 'Online', inline: true },
      )
      .setFooter({ text: `${config.botName} • Built with Discord.js v${djsVersion}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}
