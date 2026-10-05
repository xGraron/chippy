const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

//TEMPORARY
const assets = ["PLACEHOLDER"]
const names =
{
        "i1":"testitem1",
        "i2":"testitem2",
        "i3":"testitem3",
        "i4":"testitem4",
        "i5":"testitem5",
        "i6":"testitem6",
        "i7":"testitem7",
        "i8":"testitem8",
        "i9":"testitem9",
}
//TEMPORARY

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
        .setDescription(invstr)

        interaction.editReply({ embeds: [embed] })
    }
}
