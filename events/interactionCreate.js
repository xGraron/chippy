const { Events }	= require("discord.js")
const jsonfile 		= require("jsonfile")
const fs 			= require('fs')
const eh            = require('../handlers/errorHandler.js')
const dh            = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')

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

		var userStats = await dh.userGet(interaction.user.id)
		command.execute(interaction, userStats)

		dev.log(command)
	}
}
