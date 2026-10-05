const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const assets = ["PLACEHOLDER"]

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Check your inventory"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s inventory:`)
        .setDescription(`PLACEHOLDER`)

        interaction.editReply({ embeds: [embed] })
    }
}
