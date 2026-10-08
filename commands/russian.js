const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, MessageFlags } = require("discord.js")
const { Random }                             = require("random-js")
const fs    = require('fs')
const path  = require('path')
const eh    = require('../handlers/errorHandler.js')   
const xh    = require('../handlers/xpHandler.js') 
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const random	= new Random()
const gif		= ah.gif("cylinder_spin")

module.exports = 
{
    data: new SlashCommandBuilder()
        .setName("russian")
        .setDescription("Russian Roulette, are you really this broke?"),
                    
    async execute(interaction, userStats)
    {
        await interaction.deferReply()

		let initial;

		if(userStats.dead) 									return eh.error(interaction, `Dead \n-# Final round: <t:${Math.floor(userStats.lastrussian / 1000)}:F>`);
        if((Date.now() - userStats.lastrussian) < 300000) 	return eh.error(interaction, "Timeout");

        const trigger = new ButtonBuilder()
		.setCustomId("b_trigger")
		.setLabel("Trigger")
		.setStyle(ButtonStyle.Danger)
		.setDisabled(true)

		const container = new ContainerBuilder()
		.addSectionComponents((section) =>
		section
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('A round of Russian Roulette. \nWin big or lose it all... \n-# If you lose, you lose all your money, xp & level! \n-# If you win, you get 1.000 Chips'))
		.setThumbnailAccessory((thumbnail) => thumbnail.setURL(gif))
		 )
		.addSectionComponents((section) =>
		section
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent('*Do it, coward.*'))
		.setButtonAccessory(trigger)
		)

		await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })

		setTimeout(() =>
		{
			trigger.setDisabled(false)
			interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
		}, 3_000)
    }
}


