const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Welcome message management.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('message')
        .setDescription('Set the welcome message for new members.')
        .addStringOption((o) => o.setName('message').setDescription('The welcome message (use {user} for mention, {server} for server name)').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('channel')
        .setDescription('Set the welcome channel.')
        .addChannelOption((o) => o.setName('channel').setDescription('The channel to send welcome messages to').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('type')
        .setDescription('Set the welcome message type (image or text).')
        .addStringOption((o) => 
          o.setName('type')
            .setDescription('The type of welcome message')
            .setRequired(true)
            .addChoices(
              { name: 'Image', value: 'image' },
              { name: 'Text', value: 'text' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('enable')
        .setDescription('Enable the welcome system.')
    )
    .addSubcommand((sub) =>
      sub
        .setName('disable')
        .setDescription('Disable the welcome system.')
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const sub = interaction.options.getSubcommand();
    const configPath = path.join(__dirname, '..', '..', '..', 'config.json');

    // ── MESSAGE ──
    if (sub === 'message') {
      const message = interaction.options.getString('message');

      try {
        config.welcomeMessage = message;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await interaction.reply({ embeds: [successEmbed('Welcome message has been updated.')] });

        await logAction(interaction.client, buildLogEmbed({
          title: '👋 Welcome Message Updated',
          color: config.color.success,
          description: `Welcome message was updated by ${interaction.user.tag}.`,
          fields: [{ name: 'Message', value: message.substring(0, 100) + (message.length > 100 ? '...' : ''), inline: false }],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to update welcome message: ${err.message}`)], ephemeral: true });
      }

    // ── CHANNEL ──
    } else if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');

      try {
        if (!config.channels) config.channels = {};
        config.channels.welcome = channel.id;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await interaction.reply({ embeds: [successEmbed(`Welcome channel set to ${channel}.`)] });

        await logAction(interaction.client, buildLogEmbed({
          title: '👋 Welcome Channel Updated',
          color: config.color.success,
          description: `Welcome channel was set to ${channel} by ${interaction.user.tag}.`,
          fields: [{ name: 'Channel', value: `${channel} (${channel.id})`, inline: true }],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to set welcome channel: ${err.message}`)], ephemeral: true });
      }

    // ── TYPE ──
    } else if (sub === 'type') {
      const type = interaction.options.getString('type');

      try {
        config.welcomeType = type;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await interaction.reply({ embeds: [successEmbed(`Welcome type set to ${type}.`)] });

        await logAction(interaction.client, buildLogEmbed({
          title: '👋 Welcome Type Updated',
          color: config.color.success,
          description: `Welcome type was set to ${type} by ${interaction.user.tag}.`,
          fields: [{ name: 'Type', value: type, inline: true }],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to set welcome type: ${err.message}`)], ephemeral: true });
      }

    // ── ENABLE ──
    } else if (sub === 'enable') {
      try {
        config.welcomeEnabled = true;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await interaction.reply({ embeds: [successEmbed('Welcome system has been enabled.')] });

        await logAction(interaction.client, buildLogEmbed({
          title: '👋 Welcome System Enabled',
          color: config.color.success,
          description: `Welcome system was enabled by ${interaction.user.tag}.`,
          fields: [],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to enable welcome system: ${err.message}`)], ephemeral: true });
      }

    // ── DISABLE ──
    } else if (sub === 'disable') {
      try {
        config.welcomeEnabled = false;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await interaction.reply({ embeds: [successEmbed('Welcome system has been disabled.')] });

        await logAction(interaction.client, buildLogEmbed({
          title: '👋 Welcome System Disabled',
          color: config.color.error,
          description: `Welcome system was disabled by ${interaction.user.tag}.`,
          fields: [],
        }));
      } catch (err) {
        await interaction.reply({ embeds: [errorEmbed(`Failed to disable welcome system: ${err.message}`)], ephemeral: true });
      }
    }
  },
};
