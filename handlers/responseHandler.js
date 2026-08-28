const { SlashCommandBuilder, EmbedBuilder, MessageAttachment, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const jsonfile  = require("jsonfile")
const fs 		= require("fs")
const dev       = require('../handlers/dev.js')

async function respond(interaction, logIDs)
{
    const button = new ButtonBuilder()
    .setLabel("Discord server")
    .setURL("")
    .setStyle(ButtonStyle.Link)

    const row = new ActionRowBuilder().addComponents(button)

    const embed = new EmbedBuilder()
    .setTitle(`${interaction.user.displayName}, hey there!`)
    .setDescription(`The people have spoken! **Chippy *will* return** \n Work is already beginning 👀 \n`)
    .setFooter({ text: `Please keep in mind that this will take time!` })

    try     { await interaction.editReply({ embeds: [embed] }) }
    catch   { dev.log(`failed to respond \n cmdID: ${logIDs[0]}, Error: ${logIDs[1]}, 2)`) }
}

module.exports =
{
    respond,
}
