const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed, infoEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { readData, writeData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const config = require('../../../config.json');

const TICKET_CATEGORIES = [
  { label: '🛠️ Support', value: 'support', description: 'Get help from our team' },
  { label: '📋 Staff Application', value: 'staff_app', description: 'Apply for a staff position' },
  { label: '🚨 Report', value: 'report', description: 'Report a user or issue' },
  { label: '🤝 Partnership', value: 'partnership', description: 'Inquire about partnerships' },
  { label: '💬 Other', value: 'other', description: 'Any other enquiry' },
];

/**
 * Generate a self-contained HTML transcript of a ticket channel.
 * @param {import('discord.js').TextChannel} channel
 * @returns {Promise<string>} HTML string
 */
async function generateTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const rows = sorted
    .map((m) => {
      const time = new Date(m.createdTimestamp).toLocaleString();
      const content = m.content
        ? m.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        : '<em>No text content</em>';
      return `
        <div class="message">
          <img class="avatar" src="${m.author.displayAvatarURL({ size: 32, format: 'png' })}" onerror="this.style.display='none'"/>
          <div class="msg-body">
            <span class="username">${m.author.tag}</span>
            <span class="time">${time}</span>
            <div class="content">${content}</div>
          </div>
        </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket Transcript — #${channel.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#313338; color:#dbdee1; margin:0; padding:20px; }
    h1 { color:#fff; border-bottom:1px solid #4e5058; padding-bottom:10px; }
    .message { display:flex; gap:12px; padding:8px 0; border-bottom:1px solid #2b2d31; }
    .avatar { width:36px; height:36px; border-radius:50%; flex-shrink:0; margin-top:4px; }
    .username { font-weight:700; color:#f2f3f5; margin-right:8px; }
    .time { font-size:0.75em; color:#87909c; }
    .content { margin-top:4px; line-height:1.5; word-break:break-word; }
    .meta { color:#87909c; font-size:0.85em; margin-bottom:16px; }
  </style>
</head>
<body>
  <h1>🎫 Ticket Transcript</h1>
  <p class="meta">Channel: #${channel.name} &nbsp;|&nbsp; Messages: ${sorted.length} &nbsp;|&nbsp; Exported: ${new Date().toLocaleString()}</p>
  ${rows}
</body>
</html>`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system management.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Post the ticket panel in a channel.')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Channel to post the panel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('close').setDescription('Close the current ticket channel.')
    )
    .addSubcommand((sub) =>
      sub.setName('transcript').setDescription('Export this ticket as an HTML file.')
    ),

  generateTranscript,

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();

    // ── SETUP ──
    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');

      const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setColor(config.color.primary)
        .setDescription(
          'Need help? Open a ticket and our team will assist you shortly.\n\nSelect a category from the menu below to get started.'
        )
        .setFooter({ text: `${config.botName} Ticket System` })
        .setTimestamp();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_create')
        .setPlaceholder('📂 Select a ticket category...')
        .addOptions(TICKET_CATEGORIES);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ embeds: [successEmbed(`Ticket panel posted in ${channel}.`)], ephemeral: true });

    // ── CLOSE ──
    } else if (sub === 'close') {
      const tickets = readData('tickets.json');
      const ticket = Object.values(tickets).find((t) => t.channelId === interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
      }

      await interaction.reply({
        embeds: [infoEmbed('🔒 This ticket will be closed in **5 seconds**...')],
      });

      setTimeout(async () => {
        try {
          delete tickets[ticket.id];
          writeData('tickets.json', tickets);
          await interaction.channel.delete('Ticket closed');
        } catch (e) {
          console.error('[TicketClose]', e.message);
        }
      }, 5000);

    // ── TRANSCRIPT ──
    } else if (sub === 'transcript') {
      const tickets = readData('tickets.json');
      const ticket = Object.values(tickets).find((t) => t.channelId === interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const html = await generateTranscript(interaction.channel);
        const { AttachmentBuilder } = require('discord.js');
        const buffer = Buffer.from(html, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, {
          name: `transcript-${interaction.channel.name}.html`,
        });

        await interaction.editReply({
          embeds: [successEmbed('Transcript generated!')],
          files: [attachment],
        });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed(`Failed to generate transcript: ${err.message}`)] });
      }
    }
  },
};
