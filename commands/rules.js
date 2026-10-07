const { SlashCommandBuilder, EmbedBuilder, ContainerBuilder, MessageFlags } = require("discord.js")
const fs    = require
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

        const container = new ContainerBuilder()
        .setAccentColor(0x0099ff)
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent('God help me',),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent('Please have mercy',),
        )


        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
    }
}
