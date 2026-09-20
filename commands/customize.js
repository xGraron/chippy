const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")
const eh    = require("../handlers/errorHandler.js")
const dh    = require("../handlers/dataHandler.js")
const dev   = require('../handlers/dev.js')

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("customize")
    .setDescription("Customize your embed!")
    .addSubcommand(subcommand => subcommand
        .setName("picture")
        .setDescription("Change the picture in your embed")
        .addStringOption(option => option
            .setName("url")
            .setDescription("Image url")
            .setRequired(true)
            )
        ),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const thumb = await interaction.options.getString("url")

        try
        {
            const embed = new EmbedBuilder()
            .setTitle(`Success`)
            .setThumbnail(thumb)
            .setColor("#1aa32a")
            .setDescription(`Changed your embed's image`)

            try     { await interaction.editReply({ embeds: [embed] }) }
            catch   { dev.log("Failed to respond \n cmdID: 5, Error: 1", 2) }

            userStats.custom.thumbnail = thumb
            dh.userSave(userStats)
        }
        catch(error)
        {
            eh.error(interaction, "Not a valid image-url")
        }
    }
}
