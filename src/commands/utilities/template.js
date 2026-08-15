const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const path = require('path');
const { hasPermission, denyPermission } = require(path.join(__dirname, '..', '..', 'utils', 'permissions.js'));
const { successEmbed, errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const { logAction, buildLogEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'logger.js'));
const config = require('../../../config.json');

// --- TEMPLATE DEFINITIONS ---
const TEMPLATES = {
  gaming: {
    name: '🎮 Gaming Server (Exact Layout)',
    categories: [
      {
        name: '📋・SERVER INFO',
        channels: [
          { name: '📢・announcements', type: ChannelType.GuildText },
          { name: '📘・server-updates', type: ChannelType.GuildText },
          { name: '❓・faq-help', type: ChannelType.GuildText },
          { name: '📄・server-rules', type: ChannelType.GuildText },
          { name: '👀・role-creator', type: ChannelType.GuildText },
        ],
      },
      {
        name: '💬・GENERAL',
        channels: [
          { name: '💬・general-chat', type: ChannelType.GuildText },
          { name: '🎮・gaming-talk', type: ChannelType.GuildText },
          { name: '📰・gaming-news', type: ChannelType.GuildText },
          { name: '👾・memes-fun', type: ChannelType.GuildText },
          { name: '📺・clips-highlights', type: ChannelType.GuildText },
          { name: '🖌️・request-custom-role', type: ChannelType.GuildText },
          { name: '🧍・avatar-creating', type: ChannelType.GuildText },
        ],
      },
      {
        name: '📦・GAME SPECIFIC',
        channels: [
          { name: '🔫・fps-games', type: ChannelType.GuildText },
          { name: '🏎️・racing-games', type: ChannelType.GuildText },
          { name: '🎯・battle-royale', type: ChannelType.GuildText },
          { name: '👾・retro-indie', type: ChannelType.GuildText },
          { name: '🎮・console-gaming', type: ChannelType.GuildText },
          { name: '🟩・minecraft', type: ChannelType.GuildText },
          { name: '🔫・battlefront-2', type: ChannelType.GuildText },
          { name: '🧟・resident-evil', type: ChannelType.GuildText },
        ],
      },
      {
        name: '🔊・VOICE CHANNELS',
        channels: [
          { name: '🎮・Gaming Lobby', type: ChannelType.GuildVoice },
          { name: '🎯・Competitive Team 1', type: ChannelType.GuildVoice },
          { name: '🎯・Competitive Team 2', type: ChannelType.GuildVoice },
          { name: '💬・Casual Hangout', type: ChannelType.GuildVoice },
          { name: '🎵・Music & Chill', type: ChannelType.GuildVoice },
          { name: '🏆・Tournament Room', type: ChannelType.GuildVoice },
          { name: '📖・Study & Work', type: ChannelType.GuildVoice },
          { name: '🎭・Event Space', type: ChannelType.GuildVoice },
          { name: '🧍・avatar-creating', type: ChannelType.GuildVoice },
        ],
      },
      {
        name: '🛠️・SUPPORT & MODERATION',
        channels: [
          { name: '❓・help-support', type: ChannelType.GuildText },
          { name: '🧪・bug-reports', type: ChannelType.GuildText },
          { name: '📝・suggestions', type: ChannelType.GuildText },
          { name: '🔒・mod-chat', type: ChannelType.GuildText },
          { name: '📜・mod-logs', type: ChannelType.GuildText },
          { name: '🛡️・Staff Room', type: ChannelType.GuildVoice },
        ],
      },
      {
        name: '🎉・EVENTS & COMMUNITY',
        channels: [
          { name: '🗓️・events-calendar', type: ChannelType.GuildText },
          { name: '🏆・community-challenges', type: ChannelType.GuildText },
          { name: '📷・screenshots-media', type: ChannelType.GuildText },
          { name: '🎨・fan-art-creations', type: ChannelType.GuildText },
        ],
      },
    ],
    topChannels: [
      { name: '👋・welcome', type: ChannelType.GuildText },
    ],
  },

  school: {
    name: '📚 School & Academy',
    categories: [
      {
        name: '📋・INFORMATION',
        channels: [
          { name: '📢・announcements', type: ChannelType.GuildText },
          { name: '📄・syllabus-rules', type: ChannelType.GuildText },
          { name: '🗓️・schedule-calendar', type: ChannelType.GuildText },
          { name: '❓・faq-help', type: ChannelType.GuildText },
        ],
      },
      {
        name: '💬・GENERAL',
        channels: [
          { name: '💬・general-chat', type: ChannelType.GuildText },
          { name: '📚・study-discussion', type: ChannelType.GuildText },
          { name: '💡・homework-help', type: ChannelType.GuildText },
          { name: '📝・resources-notes', type: ChannelType.GuildText },
          { name: '☕・student-lounge', type: ChannelType.GuildText },
        ],
      },
      {
        name: '🎓・SUBJECTS',
        channels: [
          { name: '📐・math-science', type: ChannelType.GuildText },
          { name: '📖・literature-history', type: ChannelType.GuildText },
          { name: '💻・computer-science', type: ChannelType.GuildText },
          { name: '🎨・arts-languages', type: ChannelType.GuildText },
        ],
      },
      {
        name: '🔊・STUDY ROOMS',
        channels: [
          { name: '📖・Quiet Study 1', type: ChannelType.GuildVoice },
          { name: '📖・Quiet Study 2', type: ChannelType.GuildVoice },
          { name: '👥・Group Project 1', type: ChannelType.GuildVoice },
          { name: '👥・Group Project 2', type: ChannelType.GuildVoice },
          { name: '☕・Student Hangout', type: ChannelType.GuildVoice },
        ],
      },
      {
        name: '🛠️・STAFF & MODERATION',
        channels: [
          { name: '🔒・teacher-staff-chat', type: ChannelType.GuildText },
          { name: '📜・mod-logs', type: ChannelType.GuildText },
          { name: '🛡️・Staff Office', type: ChannelType.GuildVoice },
        ],
      },
    ],
    topChannels: [{ name: '👋・welcome', type: ChannelType.GuildText }],
  },

  roleplay: {
    name: '🎭 Roleplay & Lore',
    categories: [
      {
        name: '📜・SERVER INFO & LORE',
        channels: [
          { name: '📢・announcements', type: ChannelType.GuildText },
          { name: '📖・world-lore', type: ChannelType.GuildText },
          { name: '📄・rules-guidelines', type: ChannelType.GuildText },
          { name: '📝・character-template', type: ChannelType.GuildText },
        ],
      },
      {
        name: '👤・CHARACTERS',
        channels: [
          { name: '📤・character-submissions', type: ChannelType.GuildText },
          { name: '✅・approved-characters', type: ChannelType.GuildText },
          { name: '🎨・art-faceclaims', type: ChannelType.GuildText },
        ],
      },
      {
        name: '💬・OUT OF CHARACTER (OOC)',
        channels: [
          { name: '💬・ooc-chat', type: ChannelType.GuildText },
          { name: '💡・rp-ideas-discussion', type: ChannelType.GuildText },
          { name: '👾・memes-fun', type: ChannelType.GuildText },
        ],
      },
      {
        name: '🗺️・ROLEPLAY LOCATIONS',
        channels: [
          { name: '🏰・the-main-city', type: ChannelType.GuildText },
          { name: '🌲・the-mystic-forest', type: ChannelType.GuildText },
          { name: '⚔️・the-arena', type: ChannelType.GuildText },
          { name: '☕・the-tavern', type: ChannelType.GuildText },
        ],
      },
      {
        name: '🔊・VOICE & RP ROOMS',
        channels: [
          { name: '🎙️・OOC Voice Chat', type: ChannelType.GuildVoice },
          { name: '🎭・Live RP Room 1', type: ChannelType.GuildVoice },
          { name: '🎭・Live RP Room 2', type: ChannelType.GuildVoice },
        ],
      },
      {
        name: '🛠️・STAFF & MODERATION',
        channels: [
          { name: '🔒・mod-chat', type: ChannelType.GuildText },
          { name: '📜・mod-logs', type: ChannelType.GuildText },
          { name: '🛡️・Mod Office', type: ChannelType.GuildVoice },
        ],
      },
    ],
    topChannels: [{ name: '👋・welcome', type: ChannelType.GuildText }],
  },

  work: {
    name: '💼 Work & Business',
    categories: [
      {
        name: '📋・COMPANY INFO',
        channels: [
          { name: '📢・announcements', type: ChannelType.GuildText },
          { name: '📄・company-policies', type: ChannelType.GuildText },
          { name: '🎯・goals-roadmap', type: ChannelType.GuildText },
        ],
      },
      {
        name: '💬・GENERAL',
        channels: [
          { name: '💬・watercooler-chat', type: ChannelType.GuildText },
          { name: '💡・brainstorming', type: ChannelType.GuildText },
          { name: '❓・q-and-a', type: ChannelType.GuildText },
        ],
      },
      {
        name: '📁・PROJECTS & TEAMS',
        channels: [
          { name: '💻・dev-tech', type: ChannelType.GuildText },
          { name: '🎨・design-media', type: ChannelType.GuildText },
          { name: '📈・marketing-sales', type: ChannelType.GuildText },
          { name: '📊・reports-analytics', type: ChannelType.GuildText },
        ],
      },
      {
        name: '🔊・MEETING ROOMS',
        channels: [
          { name: '🏢・Main Boardroom', type: ChannelType.GuildVoice },
          { name: '👥・Team Huddle 1', type: ChannelType.GuildVoice },
          { name: '👥・Team Huddle 2', type: ChannelType.GuildVoice },
          { name: '☕・Coffee Break', type: ChannelType.GuildVoice },
        ],
      },
      {
        name: '🛠️・MANAGEMENT',
        channels: [
          { name: '🔒・management-chat', type: ChannelType.GuildText },
          { name: '📜・audit-logs', type: ChannelType.GuildText },
          { name: '🛡️・Executive Office', type: ChannelType.GuildVoice },
        ],
      },
    ],
    topChannels: [{ name: '👋・welcome', type: ChannelType.GuildText }],
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Apply a complete server structure template (Gaming, School, Roleplay, Work).')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Select the server template to build')
        .setRequired(true)
        .addChoices(
          { name: '🎮 Gaming Server (Exact Layout)', value: 'gaming' },
          { name: '📚 School & Academy', value: 'school' },
          { name: '🎭 Roleplay & Lore', value: 'roleplay' },
          { name: '💼 Work & Business', value: 'work' }
        )
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const templateKey = interaction.options.getString('type');
    const selectedTemplate = TEMPLATES[templateKey];

    if (!selectedTemplate) {
      return interaction.reply({ embeds: [errorEmbed('Invalid template selected.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;
      let createdCount = 0;

      // 1. Create Top Channels (without category)
      if (selectedTemplate.topChannels) {
        for (const ch of selectedTemplate.topChannels) {
          await guild.channels.create({
            name: ch.name,
            type: ch.type,
            reason: `Template setup by ${interaction.user.tag}`,
          });
          createdCount++;
        }
      }

      // 2. Create Categories and their Channels
      for (const catDef of selectedTemplate.categories) {
        const category = await guild.channels.create({
          name: catDef.name,
          type: ChannelType.GuildCategory,
          reason: `Template setup by ${interaction.user.tag}`,
        });
        createdCount++;

        for (const chDef of catDef.channels) {
          await guild.channels.create({
            name: chDef.name,
            type: chDef.type,
            parent: category.id,
            reason: `Template setup by ${interaction.user.tag}`,
          });
          createdCount++;
        }
      }

      const replyEmbed = new EmbedBuilder()
        .setTitle('✅ Server Template Applied!')
        .setColor(config.color.success || '#57F287')
        .setDescription(`Successfully created **${selectedTemplate.name}** layout with **${createdCount}** channels and categories.`)
        .setFooter({ text: `Action performed by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [replyEmbed] });

      // Log the template creation action
      await logAction(
        interaction.client,
        buildLogEmbed({
          title: '🛠️ Server Template Created',
          color: config.color.success,
          description: `**${interaction.user.tag}** applied the **${selectedTemplate.name}** template.`,
          fields: [{ name: 'Channels Created', value: `${createdCount}`, inline: true }],
        })
      );
    } catch (err) {
      console.error('Error creating server template:', err);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to build template: ${err.message}`)],
      });
    }
  },
};
