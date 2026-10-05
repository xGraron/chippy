const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const assets = ["PLACEHOLDER"]

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open the shop"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const embed = new EmbedBuilder()
        .setTitle(`Welcome in`)
        .setDescription(`Check out all the nice thing's we got`)

        interaction.editReply({ embeds: [embed] })
    }
}
