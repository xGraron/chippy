const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const random 	= new Random()

const statics	= ah.slots()
const gifs 		= ah.slots(true)

async function main(interaction, bet, userStats)
{
	var final 	= ""
	var foot	= ""
	var payline	= []

	const used 	= []
	const embed = new EmbedBuilder()
	.setTitle(`${gifs[random.integer(0, gifs.length-1)]}${gifs[random.integer(0, gifs.length-1)]}${gifs[random.integer(0, gifs.length-1)]}`)
	.setFooter({ text: `Let's go gambling!` });

	initial = await interaction.editReply({ embeds: [embed], components: [] })

	for(i = 0; i < 3; i++)
	{
		const n = random.integer(0, statics.length - 2)

		final += statics[n]

		payline.push(n)
	}

	const reward = await wincon(payline)
	const xp_rew = Math.floor(reward / 7)

    setTimeout(() => 
    {
    	embed.setTitle(final)

		if(reward > 500) //rare badge
		{
			embed
			.setColor("#1aa32a")
			.setTitle(`${statics[6]}${statics[6]}${statics[6]}`)
			.setFooter({ text: `Found secret fih! You won ${reward} Chips` });

			userStats.chips 		+= reward
			userStats.active_game 	= false

			xh.leveling(userStats, xp_rew)
			xh.achievements(userStats, userStats - reward, true, 7, reward)
		}
    	else if(reward > 0)
    	{
			if(reward === 75)	foot = "Twins! "
			else				foot = "Full row! "
    		embed
    		.setColor("#1aa32a")
			.setFooter({ text: foot + `You won ${reward} Chips` });

    		userStats.chips 		+= reward
    		userStats.active_game 	= false

    		xh.leveling(userStats, xp_rew)
    		xh.achievements(userStats, userStats - reward, true, 7, reward)
    	}
    	else 
    	{
    		embed
    		.setColor("#e80400")
			.setFooter({ text: "One more spin..."})

    		userStats.active_game 	= false

    		xh.achievements(userStats, userStats - reward, false, 7, reward)
    	}

		end(userStats, interaction, embed, bet, interaction.user.id)
    }, 3000)

}

async function wincon(payline)
{
	const [a, b, c] = payline

	if(random.bool(0.001))						return 1000
	else if(a === b && a === c)					return 500
	else if( a === b || b === c || a === c) 	return 75
	else  										return 0
}

async function end(userStats, interaction, embed, bet, UID)
{
	userStats.active_game = false;
	dh.userSave(userStats)
	ch.remove(UID)

	newStats = await dh.userGet(UID)

	const again = new ButtonBuilder()
	.setCustomId('b_again')
	.setEmoji('🔁')
	.setLabel('Play again?')
	.setStyle(ButtonStyle.Primary)

	const row 	= new ActionRowBuilder().addComponents(again)

	initial = await interaction.editReply({ embeds: [embed], components:[row] })

	const press = await new Promise(resolve =>
	{
		const collector = initial.createMessageComponentCollector({ time: 7_000 })

		let resolved = false

		collector.on("collect", async button =>
		{
			if(button.user.id !== UID) 	return button.reply({ content: "This isn't your game!", ephemeral: true })
			if(newStats.chips < bet)	return button.reply({ content: "You can't afford to play again with this bet!", ephemeral: true })
			if(newStats.active_game) 	return button.reply({ content: "You are already playing a game!", ephemeral: true })

			if(resolved) return
			resolved = true

			collector.stop("player")
			resolve(button)

			resolve(true)
		})

		collector.on("end", (collected, reason) =>
		{
			if(resolved) return

			resolved = true
			resolve(null)
		})
	})

	if(!press)
	{
		again.setDisabled(true)
		return interaction.editReply({ components: [row] })
	}
	else
	{
		await press.deferUpdate()

		newStats.chips -= bet
		newStats.active_game = true

		dh.userSave(newStats)

		main(interaction, bet, newStats, UID)
	}
}

module.exports =
{
    main,
}
