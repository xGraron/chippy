const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
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
    .setDescription("See your stats"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        Object.entries(userStats.games).forEach(game =>
        {
            const name  = available[game[0]]
            const stats = game[1]

            dev.log(name)
            dev.log(stats.won)
        })

        const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s stats:`)
        .setDescription(`Testles`)

        await interaction.editReply({ embeds: [embed] })
    }
}
