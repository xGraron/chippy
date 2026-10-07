const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
const eh    = require('../handlers/errorHandler.js')
const dev   = require('../handlers/dev.js')

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Know how to play each game"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()


        await interaction.editReply({ content: "poopoo" })
    }
}
