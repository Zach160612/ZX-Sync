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
const { errorEmbed } = require(path.join(__dirname, '..', '..', 'utils', 'embeds.js'));
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) =>
      o.setName('question').setDescription('The poll question').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Poll type')
        .setRequired(true)
        .addChoices(
          { name: 'Yes / No', value: 'yesno' },
          { name: 'Multiple Choice', value: 'multiple' }
        )
    )
    .addStringOption((o) => o.setName('option1').setDescription('Choice 1 (multiple choice only)').setRequired(false))
    .addStringOption((o) => o.setName('option2').setDescription('Choice 2 (multiple choice only)').setRequired(false))
    .addStringOption((o) => o.setName('option3').setDescription('Choice 3 (multiple choice only)').setRequired(false))
    .addStringOption((o) => o.setName('option4').setDescription('Choice 4 (multiple choice only)').setRequired(false)),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyPermission(interaction);

    const question = interaction.options.getString('question');
    const type = interaction.options.getString('type');

    const embed = new EmbedBuilder()
      .setTitle('📊 Poll')
      .setColor(config.color.primary)
      .setDescription(`**${question}**`)
      .setFooter({ text: `Poll by ${interaction.user.tag}` })
      .setTimestamp();

    let row;

    if (type === 'yesno') {
      embed.addFields(
        { name: '✅ Yes', value: '0 votes', inline: true },
        { name: '❌ No', value: '0 votes', inline: true },
      );

      row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('poll_yes').setLabel('✅ Yes').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('poll_no').setLabel('❌ No').setStyle(ButtonStyle.Danger)
      );
    } else {
      // Multiple choice
      const opts = [
        interaction.options.getString('option1'),
        interaction.options.getString('option2'),
        interaction.options.getString('option3'),
        interaction.options.getString('option4'),
      ].filter(Boolean);

      if (opts.length < 2) {
        return interaction.reply({
          embeds: [errorEmbed('Please provide at least 2 options for a multiple choice poll.')],
          ephemeral: true,
        });
      }

      const emojis = ['🇦', '🇧', '🇨', '🇩'];
      opts.forEach((opt, i) => {
        embed.addFields({ name: `${emojis[i]} ${opt}`, value: '0 votes', inline: true });
      });

      const buttons = opts.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`poll_choice_${i}`)
          .setLabel(`${emojis[i]} ${opt}`)
          .setStyle(ButtonStyle.Primary)
      );
      row = new ActionRowBuilder().addComponents(...buttons);
    }

    await interaction.reply({ embeds: [successMessage('Poll created!')], ephemeral: true }).catch(() => null);
    await interaction.channel.send({ embeds: [embed], components: [row] });

    // Helper fallback
    async function successMessage(msg) {
      return new EmbedBuilder().setColor(config.color.success).setDescription(`✅ ${msg}`);
    }
  },
};
