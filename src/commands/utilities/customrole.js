const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('path');
const { errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { readData, writeData } = require(path.join(__dirname, '..', '..', 'utils', 'dataStore.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customrole')
    .setDescription('Request a custom role with your own name and color.')
    .addStringOption((o) => o.setName('name').setDescription('The desired custom role name').setRequired(true))
    .addStringOption((o) => o.setName('color').setDescription('Hex color code (e.g. #FF5733 or RED)').setRequired(true)),

  async execute(interaction) {
    const roleName = interaction.options.getString('name');
    const roleColor = interaction.options.getString('color');
    const userId = interaction.user.id;
    const guild = interaction.guild;

    const customRoleRequests = readData('custom_roles.json');

    // Check if user already has an active open custom role request channel
    const existingChannel = Object.values(customRoleRequests).find(
      (req) => req.userId === userId && req.status === 'open'
    );

    if (existingChannel) {
      const channel = guild.channels.cache.get(existingChannel.channelId);
      return interaction.reply({
        embeds: [
          errorEmbed(
            `You already have an open custom role ticket channel: ${channel || 'active ticket'}.`
          ),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const ticketId = Date.now().toString().slice(-6);
      const channelName = `custom-role-${interaction.user.username}`;

      // Build permission overwrites: Only the User & Server Owner/Admins can see this private channel
      const overwrites = [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: guild.ownerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ];

      // Add staff roles if configured
      const staffRoles = config.staffRoles || [];
      guild.roles.cache.forEach((role) => {
        if (staffRoles.includes(role.name) || staffRoles.includes(role.id) || role.permissions.has(PermissionFlagsBits.Administrator)) {
          overwrites.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          });
        }
      });

      const privateChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites,
        topic: `Custom Role Request | ${interaction.user.tag} | Name: ${roleName} | Color: ${roleColor}`,
      });

      // Save custom role ticket record
      customRoleRequests[ticketId] = {
        id: ticketId,
        userId,
        channelId: privateChannel.id,
        roleName,
        roleColor,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      writeData('custom_roles.json', customRoleRequests);

      // Embed inside private channel
      const requestEmbed = new EmbedBuilder()
        .setTitle('✨ Custom Role Request')
        .setColor(config.color.primary || '#5865F2')
        .setDescription(
          `Hello ${interaction.user}! 👋\n\n` +
          `Your custom role request channel has been created.\n\n` +
          `• **Requested Role Name:** \`${roleName}\`\n` +
          `• **Requested Color:** \`${roleColor}\`\n\n` +
          `Discuss any details with the Owner/Staff here. When ready, click **Finish & Grant Role** below to create and assign the role and close this chat.`
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Request ID: ${ticketId}` })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`custom_role_finish_${ticketId}`)
          .setLabel('✅ Finish & Grant Role')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`custom_role_cancel_${ticketId}`)
          .setLabel('❌ Cancel Request')
          .setStyle(ButtonStyle.Danger)
      );

      await privateChannel.send({
        content: `<@${guild.ownerId}> | ${interaction.user} requested a custom role!`,
        embeds: [requestEmbed],
        components: [actionRow],
      });

      await interaction.editReply({
        content: `✅ Your private custom role channel has been created: ${privateChannel}`,
      });

      // Audit log
      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '✨ Custom Role Ticket Created',
          color: config.color.info,
          description: `Custom role ticket created by **${interaction.user.tag}** in ${privateChannel}.`,
          fields: [
            { name: 'Role Name', value: roleName, inline: true },
            { name: 'Role Color', value: roleColor, inline: true },
          ],
        })
      );
    } catch (err) {
      console.error('Error creating custom role request channel:', err);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to create custom role channel: ${err.message}`)],
      });
    }
  },
};
