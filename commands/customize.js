const { SlashCommandBuilder, EmbedBuilder, MessageAttachment, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { respond }    = require('../handlers/responseHandler.js')
const dev   = require('../handlers/dev.js')

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("customize")
    .setDescription("Customize your embed!"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        respond(interaction, [5, 1])
    }
}
