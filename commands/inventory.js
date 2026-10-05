const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')
const ih    = require('../handlers/itemHandler.js')

const names = ih.list("inv")

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Check your inventory"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        var amounts = {}
        var used    = []
        var invstr  = ""

        userStats.inventory.forEach(item =>
        {
            if(!used.includes(item))
            {
                used.push(item)
                amounts[item] = 1
            }
            else amounts[item]++
        })

        used.forEach(item =>
        {
            invstr += `${amounts[item]}x ${names[item]} \n`
        })

        const embed = new EmbedBuilder()
        .setTitle(`Your inventory`)
        .setDescription(invstr + "\n -# Buy using /shop")

        interaction.editReply({ embeds: [embed] })
    }
}
