const {
  Events,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const path = require('path');
const { readData, writeData } = require('../../utils/dataStore');
const { hasPermission } = require('../../utils/permissions');
const config = require('../../../config.json');

// ─── Ticket category labels ───────────────────────────────────
const CATEGORY_LABELS = {
  support: '🛠️ Support',
  staff_app: '📋 Staff Application',
  report: '🚨 Report',
  partnership: '🤝 Partnership',
  other: '💬 Other',
};

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    // ═══════════════════════════════════════════
    // SLASH COMMANDS
    // ═══════════════════════════════════════════
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[InteractionCreate] Command /${interaction.commandName} failed:`, err);
        const msg = { content: '❌ An error occurred while executing this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => null);
        } else {
          await interaction.reply(msg).catch(() => null);
        }
      }
      return;
    }

    // ═══════════════════════════════════════════
    // BUTTON INTERACTIONS
    // ═══════════════════════════════════════════
    if (interaction.isButton()) {
      const { customId } = interaction;

      // ── Event RSVP Buttons ──
      if (customId.startsWith('event_')) {
        const parts = customId.split('_');
        const action = parts[1]; // going / maybe / cantattend
        const eventId = parts[2];

        const events = readData('events.json');
        const event = events.find((e) => e.id === eventId);
        if (!event) {
          return interaction.reply({ content: '❌ This event no longer exists.', ephemeral: true });
        }

        const userId = interaction.user.id;
        // Remove from all lists first
        event.rsvp.going = event.rsvp.going.filter((id) => id !== userId);
        event.rsvp.maybe = event.rsvp.maybe.filter((id) => id !== userId);
        event.rsvp.cantAttend = event.rsvp.cantAttend.filter((id) => id !== userId);

        const labels = { going: 'Going ✅', maybe: 'Maybe ❔', cantattend: "Can't Attend ❌" };

        if (action === 'going') event.rsvp.going.push(userId);
        else if (action === 'maybe') event.rsvp.maybe.push(userId);
        else if (action === 'cantattend') event.rsvp.cantAttend.push(userId);

        writeData('events.json', events);

        // Update embed field counts
        const msg = interaction.message;
        const oldEmbed = msg.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed);
        const fields = updatedEmbed.data.fields || [];

        const goingField = fields.find((f) => f.name === '✅ Going');
        const maybeField = fields.find((f) => f.name === '❔ Maybe');
        const cantField = fields.find((f) => f.name === "❌ Can't Attend");

        if (goingField) goingField.value = String(event.rsvp.going.length);
        if (maybeField) maybeField.value = String(event.rsvp.maybe.length);
        if (cantField) cantField.value = String(event.rsvp.cantAttend.length);

        await msg.edit({ embeds: [updatedEmbed] });
        await interaction.reply({
          content: `✅ You're marked as **${labels[action]}** for this event.`,
          ephemeral: true,
        });
        return;
      }

      // ── Giveaway Enter Button ──
      if (customId.startsWith('giveaway_enter_')) {
        const giveawayId = customId.replace('giveaway_enter_', '');
        const giveaways = readData('giveaways.json');
        const idx = giveaways.findIndex((g) => g.id === giveawayId);

        if (idx === -1 || giveaways[idx].ended) {
          return interaction.reply({ content: '❌ This giveaway has already ended.', ephemeral: true });
        }

        const userId = interaction.user.id;
        if (giveaways[idx].entries.includes(userId)) {
          return interaction.reply({ content: '⚠️ You have already entered this giveaway!', ephemeral: true });
        }

        giveaways[idx].entries.push(userId);
        writeData('giveaways.json', giveaways);

        // Update entry count on embed
        const msg = interaction.message;
        const oldEmbed = msg.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed);
        const entriesField = updatedEmbed.data.fields?.find((f) => f.name === '👥 Entries');
        if (entriesField) entriesField.value = String(giveaways[idx].entries.length);
        await msg.edit({ embeds: [updatedEmbed] });

        await interaction.reply({ content: '🎉 You have entered the giveaway! Good luck!', ephemeral: true });
        return;
      }

      // ── Poll Buttons ──
      if (customId.startsWith('poll_')) {
        const msg = interaction.message;
        const oldEmbed = msg.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed);

        // Track voters via message reactions (simple approach — store in field value)
        // For simplicity, we just increment the matching field's vote count
        const fields = updatedEmbed.data.fields || [];
        let matched = false;

        if (customId === 'poll_yes') {
          const f = fields.find((fi) => fi.name === '✅ Yes');
          if (f) { const v = parseInt(f.value) + 1; f.value = `${v} vote${v !== 1 ? 's' : ''}`; matched = true; }
        } else if (customId === 'poll_no') {
          const f = fields.find((fi) => fi.name === '❌ No');
          if (f) { const v = parseInt(f.value) + 1; f.value = `${v} vote${v !== 1 ? 's' : ''}`; matched = true; }
        } else if (customId.startsWith('poll_choice_')) {
          const idx = parseInt(customId.split('_')[2]);
          if (!isNaN(idx) && fields[idx]) {
            const v = parseInt(fields[idx].value) + 1;
            fields[idx].value = `${v} vote${v !== 1 ? 's' : ''}`;
            matched = true;
          }
        }

        if (matched) await msg.edit({ embeds: [updatedEmbed] });
        await interaction.reply({ content: '✅ Your vote has been recorded!', ephemeral: true });
        return;
      }

      return;
    }

    // ═══════════════════════════════════════════
    // SELECT MENU INTERACTIONS
    // ═══════════════════════════════════════════
    if (interaction.isStringSelectMenu()) {
      // ── Ticket Creation ──
      if (interaction.customId === 'ticket_create') {
        const category = interaction.values[0];
        const categoryLabel = CATEGORY_LABELS[category] || 'Ticket';
        const userId = interaction.user.id;
        const tickets = readData('tickets.json');

        // Prevent duplicate open tickets per user
        const existingTicket = Object.values(tickets).find(
          (t) => t.userId === userId && t.category === category
        );
        if (existingTicket) {
          return interaction.reply({
            content: `❌ You already have an open **${categoryLabel}** ticket!`,
            ephemeral: true,
          });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
          const guild = interaction.guild;
          const ticketId = Date.now().toString();
          const channelName = `ticket-${interaction.user.username}-${ticketId.slice(-4)}`;

          // Build permission overwrites
          const overwrites = [
            { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
            { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          ];

          // Add support role if configured
          const supportRoleId = config.ticketSupportRole;
          if (supportRoleId && supportRoleId !== 'SUPPORT_ROLE_ID_HERE') {
            const supportRole = guild.roles.cache.get(supportRoleId);
            if (supportRole) {
              overwrites.push({
                id: supportRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
              });
            }
          }

          const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: overwrites,
            topic: `Ticket | ${categoryLabel} | ${interaction.user.tag}`,
          });

          // Save ticket record
          tickets[ticketId] = {
            id: ticketId,
            userId,
            category,
            channelId: ticketChannel.id,
            createdAt: new Date().toISOString(),
          };
          writeData('tickets.json', tickets);

          // Send welcome embed in the ticket channel
          const ticketEmbed = new EmbedBuilder()
            .setTitle(`${categoryLabel} — Ticket`)
            .setColor(config.color.primary)
            .setDescription(
              `Hello ${interaction.user}! 👋\n\nWelcome to your **${categoryLabel}** ticket.\nPlease describe your issue and a staff member will be with you shortly.\n\nTo close this ticket, a staff member can run \`/ticket close\`.`
            )
            .setFooter({ text: `Ticket ID: ${ticketId}` })
            .setTimestamp();

          const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ticket_close_${ticketId}`)
              .setLabel('🔒 Close Ticket')
              .setStyle(ButtonStyle.Danger)
          );

          await ticketChannel.send({ embeds: [ticketEmbed], components: [closeRow] });

          await interaction.editReply({
            content: `✅ Your ticket has been created: ${ticketChannel}`,
          });
        } catch (err) {
          console.error('[TicketCreate]', err.message);
          await interaction.editReply({ content: `❌ Failed to create ticket: ${err.message}` });
        }
        return;
      }
    }
  },
};
