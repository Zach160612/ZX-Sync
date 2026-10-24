const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const path = require('path');
const { addMessageXp } = require(path.join(__dirname, '..', '..', 'utils', 'streamStore.js'));
const config = require('../../../config.json');

const QUESTIONS = [
  {
    question: 'In Minecraft, what item is needed to brew an Invisibility Potion?',
    options: ['Fermented Spider Eye', 'Blaze Powder', 'Ghast Tear', 'Magma Cream'],
    correct: 0,
    explanation: 'A Fermented Spider Eye is added to a Potion of Night Vision to invert it into Invisibility!',
  },
  {
    question: 'In Valorant, which agent is known as the "Bounty Hunter from Turkey"?',
    options: ['Cypher', 'Fade', 'Reyna', 'Skye'],
    correct: 1,
    explanation: 'Fade is the Turkish initiator and radiant bounty hunter!',
  },
  {
    question: 'What is the highest selling video game of all time?',
    options: ['Grand Theft Auto V', 'Tetris', 'Minecraft', 'Wii Sports'],
    correct: 2,
    explanation: 'Minecraft has sold over 300 million copies worldwide!',
  },
  {
    question: 'Which game popularized the Battle Royale genre before Fortnite battle royale released?',
    options: ['Apex Legends', 'PUBG (PlayerUnknown\'s Battlegrounds)', 'Call of Duty: Warzone', 'H1Z1'],
    correct: 1,
    explanation: 'PUBG popularized the 100-player battle royale genre in 2017 before Fortnite added BR mode!',
  },
  {
    question: 'What was Twitch.tv originally called before rebranding to Twitch in 2011?',
    options: ['StreamHub', 'Justin.tv', 'LiveGaming', 'Broadcast.me'],
    correct: 1,
    explanation: 'Twitch was originally Justin.tv, founded by Justin Kan and Emmett Shear in 2007!',
  },
  {
    question: 'In Grand Theft Auto V, what are the names of the three main protagonists?',
    options: ['Franklin, Michael, Trevor', 'CJ, Tommy, Claude', 'Niko, Roman, Dimitri', 'Arthur, John, Dutch'],
    correct: 0,
    explanation: 'GTA V\'s iconic trio is Franklin Clinton, Michael De Santa, and Trevor Philips!',
  },
  {
    question: 'What is the maximum build height in modern Minecraft (1.18+)?',
    options: ['256 blocks', '320 blocks', '384 blocks', '512 blocks'],
    correct: 1,
    explanation: 'The world height was expanded from Y=256 up to Y=320 in the Caves & Cliffs update!',
  },
  {
    question: 'In Counter-Strike, how long does the C4 bomb take to detonate after being planted?',
    options: ['35 seconds', '40 seconds', '45 seconds', '50 seconds'],
    correct: 1,
    explanation: 'In competitive CS:GO and CS2, the bomb timer is exactly 40 seconds!',
  },
  {
    question: 'What is the name of the protagonist in the Legend of Zelda series?',
    options: ['Zelda', 'Link', 'Ganon', 'Epona'],
    correct: 1,
    explanation: 'Link is the hero of Hyrule; Princess Zelda is the royal princess!',
  },
  {
    question: 'In League of Legends, how many players are on each team in a standard Summoner\'s Rift match?',
    options: ['4', '5', '6', '3'],
    correct: 1,
    explanation: 'Standard matches are 5v5 across Top, Jungle, Mid, ADC, and Support!',
  },
  {
    question: 'Which of the following is NOT an original starter Pokémon in Generation 1?',
    options: ['Bulbasaur', 'Charmander', 'Pikachu', 'Squirtle'],
    correct: 2,
    explanation: 'In Pokémon Red & Blue, the starters were Bulbasaur, Charmander, and Squirtle. Pikachu was the starter in Pokémon Yellow!',
  },
  {
    question: 'In Fortnite, what is the legendary tier color for weapons?',
    options: ['Purple', 'Gold / Orange', 'Blue', 'Cyan'],
    correct: 1,
    explanation: 'Legendary weapons shine in iconic Gold / Orange!',
  },
  {
    question: 'Which game studio developed the Dark Souls series and Elden Ring?',
    options: ['Bethesda', 'FromSoftware', 'Capcom', 'CD Projekt Red'],
    correct: 1,
    explanation: 'FromSoftware and Hidetaka Miyazaki created the soulsborne genre!',
  },
  {
    question: 'In Among Us, what color is typically blamed first as "sus"?',
    options: ['Red', 'Blue', 'Black', 'Lime'],
    correct: 0,
    explanation: '"Red is sus" became one of the biggest gaming memes on the internet!',
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Start a 25-second community gaming & stream trivia challenge!'),

  async execute(interaction) {
    const trivia = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const DURATION = 25;
    const expiresAt = Math.floor((Date.now() + DURATION * 1000) / 1000);

    const labels = ['A', 'B', 'C', 'D'];
    const playerAnswers = new Map(); // userId -> { choiceIndex, username }

    function buildQuestionEmbed() {
      const optionsFormatted = trivia.options
        .map((opt, i) => `**${labels[i]}**: ${opt}`)
        .join('\n');

      return new EmbedBuilder()
        .setTitle('🧠 Community Gaming Trivia Challenge!')
        .setColor(config.color?.primary || '#5865F2')
        .setDescription(`### "${trivia.question}"\n\n${optionsFormatted}\n\n⏱️ You have **<t:${expiresAt}:R>** to click your answer below!`)
        .setFooter({ text: 'ZX Stream Community Trivia • Everyone can participate!' })
        .setTimestamp();
    }

    const row = new ActionRowBuilder().addComponents(
      trivia.options.map((_, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${i}`)
          .setStyle(ButtonStyle.Primary)
          .setLabel(`Option ${labels[i]}`)
      )
    );

    await interaction.reply({
      content: '🎮 **TRIVIA TIME! Can the community get this right?**',
      embeds: [buildQuestionEmbed()],
      components: [row],
    });

    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.customId.startsWith('trivia_'),
      time: DURATION * 1000,
    });

    collector.on('collect', async (btnInt) => {
      const choiceIndex = parseInt(btnInt.customId.split('_')[1], 10);
      playerAnswers.set(btnInt.user.id, {
        choiceIndex,
        username: btnInt.user.username,
        member: btnInt.member,
      });

      await btnInt.reply({
        content: `✅ You selected **Option ${labels[choiceIndex]}: ${trivia.options[choiceIndex]}**! Let's see if you're right when time expires!`,
        ephemeral: true,
      });
    });

    collector.on('end', async () => {
      const correctOption = trivia.options[trivia.correct];
      const correctLetter = labels[trivia.correct];

      const winners = [];
      const wrong = [];

      for (const [userId, answer] of playerAnswers.entries()) {
        if (answer.choiceIndex === trivia.correct) {
          winners.push(answer.username);
          // Reward XP for correct answer
          addMessageXp(interaction.guild.id, userId, answer.username);
        } else {
          wrong.push(answer.username);
        }
      }

      // Build disabled buttons with correct colored green and wrong grey
      const resultButtons = trivia.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_end_${i}`)
          .setStyle(i === trivia.correct ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setLabel(`${labels[i]}: ${opt}${i === trivia.correct ? ' ✅' : ''}`)
          .setDisabled(true)
      );

      const resultRow = new ActionRowBuilder().addComponents(resultButtons);

      const resultEmbed = new EmbedBuilder()
        .setTitle('🎯 Trivia Results!')
        .setColor(winners.length > 0 ? '#57F287' : '#ED4245')
        .setDescription(
          `**Question:** *${trivia.question}*\n\n` +
            `✅ **Correct Answer:** **${correctLetter}: ${correctOption}**\n` +
            `💡 *${trivia.explanation}*`
        )
        .addFields(
          {
            name: `🏆 Trivia Champions (${winners.length})`,
            value: winners.length > 0 ? winners.map((w) => `• **${w}** (+XP 🌟)`).join('\n') : '*No one got it right this round! Better luck next time!*',
            inline: true,
          },
          {
            name: `❌ Missed It (${wrong.length})`,
            value: wrong.length > 0 ? wrong.map((w) => `• ${w}`).join('\n') : '*No incorrect answers!*',
            inline: true,
          }
        )
        .setFooter({ text: 'ZX Stream Community Trivia • Type /trivia to play again!' })
        .setTimestamp();

      await msg
        .edit({
          content: winners.length > 0 ? `🎉 Shoutout to our **${winners.length}** trivia winner(s)!` : '🧠 That was a tough one!',
          embeds: [resultEmbed],
          components: [resultRow],
        })
        .catch(() => null);
    });
  },
};
