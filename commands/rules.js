const { SlashCommandBuilder, EmbedBuilder, ContainerBuilder, MessageFlags } = require("discord.js")
const fs    = require
const eh    = require('../handlers/errorHandler.js')
const dev   = require('../handlers/dev.js')


const rules =
[
    '**High or Low** \nYou draw a card, then you must guess whether the next card will be \n- Lower than, \n- Higher than, or \n- Equal to the first. \nThe values are: Ace/2-10, Jack, Queen, King \n-# Played with a standard deck of 52 cards',

    '**Blackjack** \nYour goal is to get as close to 21 as possible *without* going over \nIn order to win you must have: \n- More than the dealer, or \n- The dealer "busts" (goes over 21) or \n- You get an Ace & 10 as your initial two cards. \nAt the start, you get two cards. So does the dealer, but you can only see one of his. \nYou may then "Hit", getting dealt another card, or "Stand", making it the dealers turn. \nIf you go over 21, you immediately lose. \nThe values are: 2-10/Jack/Queen/King, Ace = 2 or 11, \nwhichever benefits you most. \n-# Played with a standard deck of 52 cards',

    '**Horse Races** \nThe horse you place your bet on must win the race. \n-# Essentially a 1/7 chance to win',

    '**Slots** \nYou must get at least two of the same symbols in order to win money. \nThey do not have to be next to each other',

    '**Poker** \nYour goal is to have a better Five-card Poker hand than the Dealer. \nInitially, you & the dealer get two cards and three community cards. \nYou can not see the dealers cards. \nYou may fold if you believe you dont have a good chance. \nIf you fold, you only lose half of your bet \n-# Played with a standard deck of 52 cards',

    '**Card Rush** \nSame as High or Low, but you must play three rounds before being able to "Cash out" \nAfterwards, you have the option to cash out after each round, \nsecuring your winnings. \nIf you lose, you lose everything you earnt up until that point \n-# Go long enough to be cashed out automatically, granting you a huge reward'
]

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Know how to play each game"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('## Rules \n Maximum bet for each game is 1.000 Chips! \n You will lose if you fail to react in time!'))
        .addSeparatorComponents((separator) => separator)

        rules.forEach(rule =>
        {
            container
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(rule))
            .addSeparatorComponents((separator) => separator)
        })

        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
    }
}
