const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../../../config.json');

const TOPICS = [
  // ─── 🎮 Gaming Hot Takes & Debates ───
  { category: '🎮 Gaming Hot Take', question: "What is an 'overrated' game that everyone seems to love, but you secretly dislike?" },
  { category: '🎮 Gaming Debate', question: 'Mouse & Keyboard or Controller for first-person shooters? Settle this once and for all.' },
  { category: '🎮 Gaming Hot Take', question: 'What is the single best gaming soundtrack of all time?' },
  { category: '🎮 Gaming Debate', question: 'If you had to delete one game forever: Minecraft, Fortnite, GTA V, or Valorant/CS?' },
  { category: '🎮 Gaming Question', question: 'What is the hardest boss fight or gaming level you have ever beaten?' },
  { category: '🎮 Gaming Hot Take', question: 'Single-player story games vs. Multiplayer competitive games: which era was peak gaming?' },
  { category: '🎮 Gaming Question', question: 'If you could bring any video game mechanic into real life, what would you choose?' },
  { category: '🎮 Gaming Debate', question: 'Pay-to-win microtransactions vs. \$70 unfinished games: which is ruining gaming more?' },
  { category: '🎮 Gaming Question', question: 'What is an absolute hidden gem game that more people in this server need to play?' },
  { category: '🎮 Gaming Hot Take', question: 'Is graphics or gameplay more important? Give an example of a game that proved it.' },
  { category: '🎮 Gaming Debate', question: 'Which gaming franchise fell off the hardest after its golden era?' },
  { category: '🎮 Gaming Question', question: 'What was the very first game you ever fell in love with?' },
  { category: '🎮 Gaming Hot Take', question: 'Call of Duty hasn\'t hit the same since 2012 — fact or cap?' },
  { category: '🎮 Gaming Question', question: 'What\'s your biggest gaming pet peeve when playing with random teammates?' },

  // ─── 🤔 Would You Rather? ───
  { category: '🤔 Would You Rather', question: 'Would you rather play every game on 150ms ping forever, OR play on 30 FPS forever?' },
  { category: '🤔 Would You Rather', question: 'Would you rather only play retro games (pre-2005) or only play new games released from today onwards?' },
  { category: '🤔 Would You Rather', question: 'Would you rather get \$10,000 right now or be in the top 0.01% of players in your favorite game?' },
  { category: '🤔 Would You Rather', question: 'Would you rather have infinite Discord Nitro or a 1-year free pass to any game release?' },
  { category: '🤔 Would You Rather', question: 'Would you rather stream 12 hours a day every day or work a regular 9-5 job?' },
  { category: '🤔 Would You Rather', question: 'Would you rather win a 1v5 clutch on stream or win a \$1,000 giveaway?' },
  { category: '🤔 Would You Rather', question: 'Would you rather never be able to mute your mic or never be able to turn off your camera in voice calls?' },

  // ─── 📺 Stream & Community Talk ───
  { category: '📺 Stream Talk', question: 'What has been your favorite stream moment or stream joke so far?' },
  { category: '📺 Stream Talk', question: 'What game would you love to see streamed next on the channel?' },
  { category: '📺 Stream Talk', question: 'Should we host a community tournament or viewer customs night soon? What game should we play?' },
  { category: '📺 Stream Talk', question: 'What\'s the funniest reaction you\'ve ever witnessed on stream?' },
  { category: '📺 Stream Talk', question: 'If the streamer had to do a 24-hour stream punishment, what challenge should they do?' },
  { category: '📺 Stream Talk', question: 'What\'s your go-to snack and drink combo when tuning into a live stream?' },

  // ─── 💬 Icebreakers & Spicy Opinions ───
  { category: '💬 Chat Icebreaker', question: 'Pineapple on pizza: delicious or a war crime? Defend your answer.' },
  { category: '💬 Chat Icebreaker', question: 'What is your uncontested #1 fast food order when it\'s 1:00 AM?' },
  { category: '💬 Chat Icebreaker', question: 'What is a movie, show, or anime that you think is a 10/10 masterpiece?' },
  { category: '💬 Chat Icebreaker', question: 'What song immediately gets added to your gaming hype playlist?' },
  { category: '💬 Chat Icebreaker', question: 'If you had to survive a zombie apocalypse with 3 people from this server, who are you picking?' },
  { category: '💬 Chat Icebreaker', question: 'What is a popular trend right now that you just cannot understand?' },
  { category: '💬 Chat Icebreaker', question: 'What is the worst advice you\'ve ever received in your life?' },
  { category: '💬 Chat Icebreaker', question: 'What is your guilty pleasure song that you only blast when you\'re alone?' },
  { category: '💬 Chat Icebreaker', question: 'Night owl or early bird? What time does your gaming session usually end?' },
];

function getRandomTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

function buildTopicEmbed(topic, requestedBy) {
  return new EmbedBuilder()
    .setTitle(`💬 ${topic.category}`)
    .setColor(config.color?.primary || '#5865F2')
    .setDescription(`### "${topic.question}"\n\nDrop your thoughts, hot takes, or answers below! 👇`)
    .setFooter({ text: `Requested by ${requestedBy} • Click "Another Topic" to roll again!` })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Revive chat with a fun gaming debate, hot take, or conversation starter!'),

  getRandomTopic,
  buildTopicEmbed,

  async execute(interaction) {
    const topic = getRandomTopic();
    const embed = buildTopicEmbed(topic, interaction.user.username);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('topic_next')
        .setStyle(ButtonStyle.Primary)
        .setLabel('🎲 Another Topic')
        .setEmoji('🔄')
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
