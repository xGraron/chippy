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

		var pulled = false

		let initial;

		if(userStats.dead) return eh.error(interaction, `Dead. \n-# Final round: <t:${Math.floor(userStats.lastrussian / 1000)}:F>`);

        const trigger = new ButtonBuilder()
		.setCustomId("b_trigger")
		.setLabel("Trigger")
		.setStyle(ButtonStyle.Danger)
		.setDisabled(true)

		const container = new ContainerBuilder()
		.addSectionComponents((section) =>
		section
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('A round of Russian Roulette. \nWin big or lose it all... \n-# If you lose, you lose all your money, xp & level! \n-# If you win, you get 500 Chips'))
		.setThumbnailAccessory((thumbnail) => thumbnail.setURL(gif))
		 )
		.addSectionComponents((section) =>
		section
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent('*Do it, coward.*'))
		.setButtonAccessory(trigger)
		)

		await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true })

		setTimeout(async () =>
		{
			trigger.setDisabled(false)
			initial = await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })

			const pull = await new Promise(resolve =>
			{
				const collector = initial.createMessageComponentCollector({ time: 3_000 })

				collector.on("collect", async selection =>
				{
					pulled = true

					selection.deferUpdate()
					resolve("player")
				})

				collector.on("end", (collected, reason) =>
				{
					resolve(null)
				})
			})

			container.components.splice(0, 2)

			if(!pulled)
			{
				container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('**Coward.** \nProbably the right choice...'))

				return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })
			}
			else if(userStats.inventory.includes("i1"))
			{
				userStats.inventory.splice(userStats.inventory.indexOf("i1"), 1)

				container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('**Well well well...** \nYour blank saved you!'))
			}
			else if(random.bool(0.16))
			{
				userStats =
				{
					userID: userStats.userID,
					registered: Date.now(),
					xp: 0,
					level: 1,
					chips: 500,
					active_game: false,
					lastbeg: 0,
					inventory: [],
					games: {},
					achievements: ["90"],
					custom: {},
				}

				container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('## Truth is, the game was rigged from the start. \n-#  *Your progress has been reset*'))
			}
			else
			{
				userStats.chips += 500

				container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('**Lucky bastard.** \nYou made it! Here, have your reward.'))
			}

			interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 })

			dh.userSave(userStats.userID, userStats)
		}, 3_000)
    }
}

