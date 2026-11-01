const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, } = require("discord.js")
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const available =
{
    1: "High Or Low",
    2: "Roulette",
    3: "Baccarat",
    4: "Blackjack",
    5: "Horse Races",
    6: "Coinflip",
    7: "Slots",
    8: "Poker",
    9: "Card Rush",
    10: "Dice Roll",
}

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("See your stats")
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel
    ),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const embed = new EmbedBuilder()
        .setTitle("Your stats")

        Object.entries(userStats.games).forEach(game =>
        {
            const named = available[game[0]]
            const stats = game[1]

            dev.log(stats)
            embed.addFields({ name: named, value: `${stats.won}/${stats.played} games played were won \nWon a total of ${stats.earned} Chips`})
        })

        await interaction.editReply({ embeds: [embed] })
    }
}
