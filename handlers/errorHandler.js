const { EmbedBuilder, ActionRowBuilder } 	= require("discord.js")
const jsonfile  = require("jsonfile")
const fs 		= require("fs")
const dev       = require('../handlers/dev.js')

async function error(interaction, e_text)
{
    const row   = new ActionRowBuilder()
	const embed = new EmbedBuilder()
	.setTitle("An error has occured")
	.setColor(`#e80400`)
    .setDescription(e_text + "\n\n-# If you believe this is a bug, contact <@467019235328000001>")

    try             { await interaction.editReply({ embeds: [embed], components: [] }) }   
    catch(error)    { dev.log(`Error handler failed to edit message! \nError message: ${e_text} \nError: \n${error}`, 2) }  
}

module.exports =
{
    error,
}
