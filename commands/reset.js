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
        await interaction.deferReply({ ephemeral: true })

        const button   = new ButtonBuilder()
        .setCustomId("b_reset")
        .setLabel("RESET PROGRESS")
        .setStyle(ButtonStyle.Danger)
        const embed     = new EmbedBuilder()
        .setTitle(`ATTENTION`)
        .setColor("#1aa32a")
        .setDescription(`THIS IS IRREVERSIBLE. \n Clicking the button below will delete your *entire* progress*!`)
        const row       = new ActionRowBuilder().addComponents(button)

        let initial;

        try     { initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
        catch   { dev.log("Failed to respond \n cmdID: TEMP, Error: 1", 2) }

        const pressed = await initial.createMessageComponentCollector({ time: 10_000 })

        pressed.on('collect', async press =>
        {
            press.deferUpdate()

            userStats =
            {
                userID: userStats.userID,
                registered: Date.now(),
                   xp: 0,
                   level: 1,
                   chips: 2500,
                   active_game: false,
                   lastbeg: 0,
                   inventory: {},
                   games: {},
                   achievements: [16],
                   custom: {},
            }

            dh.userSave(userStats.userID, userStats)

            button.setStyle(ButtonStyle.Success)
            embed
            .setTitle(`SUCCESS`)
            .setColor("#1aa32a")
            .setDescription(`Your progress has been reset.`)

            return pressed.stop()
        })


        pressed.on('end', async collected =>
        {
            button.setDisabled(true)

            try 	{ interaction.editReply({ embeds: [embed], components: [row] })	}
            catch 	{ dev.log("Failed to respond \n GameID: TEMP, Error: 2", 2) }
        })
    }
}
