const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const eh    = require("../handlers/errorHandler.js")
const dh    = require("../handlers/dataHandler.js")
const dev   = require('../handlers/dev.js')

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset your progress"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const trigger   = new ButtonBuilder()
        .setCustomId("b_reset")
        .setLabel("RESET PROGRESS")
        .setStyle(ButtonStyle.Danger)
        const embed     = new EmbedBuilder()
        .setTitle(`ATTENTION`)
        .setColor("#1aa32a")
        .setDescription(`THIS IS IRREVERSIBLE. \n Clicking the button below will delete your *entire* progress*.`)
        const row       = new ActionRowBuilder().addComponents(trigger)


        try     { await interaction.editReply({ embeds: [embed], components: [row] }) }
        catch   { dev.log("Failed to respond \n cmdID: TEMP, Error: 1", 2) }

        setTimeout(() =>
        {
            dev.log("I love balkl")
        }, 5000)

        //const pressed = await initial.createMessageComponentCollector({ time: 10_000 })
    }
}
