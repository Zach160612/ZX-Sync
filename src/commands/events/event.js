const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { errorEmbed, successEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { readData, writeData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const config = require('../../../config.json');
const cron = require('node-cron');

/**
 * Schedule event reminders at 24h, 1h, 15m before start.
 * @param {import('discord.js').Client} client
 * @param {object} event
 */
function scheduleReminders(client, event) {
  const eventDate = new Date(event.timestamp);
  const reminders = [
    { label: '24 hours', offset: 24 * 60 * 60 * 1000 },
    { label: '1 hour', offset: 60 * 60 * 1000 },
    { label: '15 minutes', offset: 15 * 60 * 1000 },
  ];

  for (const { label, offset } of reminders) {
    const reminderTime = new Date(eventDate.getTime() - offset);
    const now = Date.now();

    if (reminderTime.getTime() <= now) continue; // Already passed

    const delay = reminderTime.getTime() - now;
    setTimeout(async () => {
      try {
        const channel = await client.channels.fetch(event.channelId).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
          .setTitle(`⏰ Event Reminder — ${event.name}`)
          .setColor(config.color.primary)
          .setDescription(`**${event.name}** starts in **${label}**!\n\n${event.description}`)
          .addFields({ name: '📅 Date & Time', value: event.dateDisplay, inline: false })
          .setTimestamp();

        if (event.image) embed.setImage(event.image);

        await channel.send({ embeds: [embed] });
      } catch (e) {
        console.error('[EventReminder] Error:', e.message);
      }
    }, delay);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage server events.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new event.')
        .addStringOption((o) => o.setName('name').setDescription('Event name').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('Event description').setRequired(true))
        .addStringOption((o) => o.setName('date').setDescription('Date (YYYY-MM-DD)').setRequired(true))
        .addStringOption((o) => o.setName('time').setDescription('Time (HH:MM, 24-hour)').setRequired(true))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel to post the event').setRequired(true))
        .addStringOption((o) => o.setName('image').setDescription('Optional image URL').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Edit an existing event.')
        .addStringOption((o) => o.setName('id').setDescription('Event ID').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(false))
        .addStringOption((o) => o.setName('description').setDescription('New description').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete an event.')
        .addStringOption((o) => o.setName('id').setDescription('Event ID').setRequired(true))
    ),

  scheduleReminders,

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();

    // ── CREATE ──
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const date = interaction.options.getString('date');
      const time = interaction.options.getString('time');
      const channel = interaction.options.getChannel('channel');
      const image = interaction.options.getString('image') || null;

      // Validate date/time
      const timestamp = new Date(`${date}T${time}:00`);
      if (isNaN(timestamp.getTime())) {
        return interaction.reply({
          embeds: [errorEmbed('Invalid date or time format. Use `YYYY-MM-DD` and `HH:MM`.')],
          ephemeral: true,
        });
      }
      if (timestamp.getTime() <= Date.now()) {
        return interaction.reply({ embeds: [errorEmbed('Event date must be in the future.')], ephemeral: true });
      }

      const eventId = Date.now().toString();
      const dateDisplay = `<t:${Math.floor(timestamp.getTime() / 1000)}:F>`;

      const embed = new EmbedBuilder()
        .setTitle(`📅 ${name}`)
        .setColor(config.color.primary)
        .setDescription(description)
        .addFields(
          { name: '🕐 Date & Time', value: dateDisplay, inline: true },
          { name: '📍 Channel', value: `${channel}`, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: '✅ Going', value: '0', inline: true },
          { name: '❔ Maybe', value: '0', inline: true },
          { name: '❌ Can\'t Attend', value: '0', inline: true },
        )
        .setFooter({ text: `Event ID: ${eventId} • Created by ${interaction.user.tag}` })
        .setTimestamp();

      if (image) embed.setImage(image);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`event_going_${eventId}`).setLabel('✅ Going').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`event_maybe_${eventId}`).setLabel('❔ Maybe').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`event_cantattend_${eventId}`).setLabel('❌ Can\'t Attend').setStyle(ButtonStyle.Danger)
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });

      // Save event
      const events = readData('events.json');
      const newEvent = {
        id: eventId,
        name,
        description,
        date,
        time,
        dateDisplay,
        channelId: channel.id,
        messageId: msg.id,
        image,
        timestamp: timestamp.toISOString(),
        createdBy: interaction.user.tag,
        rsvp: { going: [], maybe: [], cantAttend: [] },
      };
      events.push(newEvent);
      writeData('events.json', events);

      // Schedule reminders
      scheduleReminders(interaction.client, newEvent);

      await interaction.reply({
        embeds: [successEmbed(`Event **${name}** posted in ${channel}!\nEvent ID: \`${eventId}\``)],
        ephemeral: true,
      });

    // ── EDIT ──
    } else if (sub === 'edit') {
      const id = interaction.options.getString('id');
      const newName = interaction.options.getString('name');
      const newDesc = interaction.options.getString('description');

      const events = readData('events.json');
      const idx = events.findIndex((e) => e.id === id);

      if (idx === -1) {
        return interaction.reply({ embeds: [errorEmbed(`No event found with ID \`${id}\`.`)], ephemeral: true });
      }

      if (newName) events[idx].name = newName;
      if (newDesc) events[idx].description = newDesc;
      writeData('events.json', events);

      // Update the Discord message
      try {
        const channel = await interaction.client.channels.fetch(events[idx].channelId);
        const message = await channel.messages.fetch(events[idx].messageId);
        const oldEmbed = message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed)
          .setTitle(`📅 ${events[idx].name}`)
          .setDescription(events[idx].description);
        await message.edit({ embeds: [updatedEmbed] });
      } catch (e) {
        console.warn('[EventEdit] Could not update message:', e.message);
      }

      await interaction.reply({ embeds: [successEmbed(`Event \`${id}\` updated.`)], ephemeral: true });

    // ── DELETE ──
    } else if (sub === 'delete') {
      const id = interaction.options.getString('id');
      const events = readData('events.json');
      const idx = events.findIndex((e) => e.id === id);

      if (idx === -1) {
        return interaction.reply({ embeds: [errorEmbed(`No event found with ID \`${id}\`.`)], ephemeral: true });
      }

      // Delete the Discord message
      try {
        const channel = await interaction.client.channels.fetch(events[idx].channelId);
        const message = await channel.messages.fetch(events[idx].messageId);
        await message.delete();
      } catch (e) {
        console.warn('[EventDelete] Could not delete message:', e.message);
      }

      events.splice(idx, 1);
      writeData('events.json', events);

      await interaction.reply({ embeds: [successEmbed(`Event \`${id}\` deleted.`)], ephemeral: true });
    }
  },
};
