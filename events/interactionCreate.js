const { Events }	= require("discord.js")
const jsonfile 		= require("jsonfile")
const fs 			= require('fs')
const eh            = require('../handlers/errorHandler.js')

module.exports =
{
	name: Events.InteractionCreate,
	async execute(interaction, client)
	{
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName)

		if(!command) 
		{ 
			console.error(`No command matching ${interaction.commandName} was found`); 
			eh.error(interaction, "Command not found")
			return; 
		}

		command.execute(interaction)
	}
}
