const { SlashCommandBuilder, EmbedBuilder, MessageAttachment, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { respond }    = require('../handlers/responseHandler.js')
const dev   = require("../handlers/dev.js")

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the global leaderboard"),

    async execute(interaction)
    {
        await interaction.deferReply()

        respond(interaction, [7, 1])
    }
}
