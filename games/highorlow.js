const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const values = 
{
	"Ace": 	2,
	"Jack": 10,
	"Queen": 10,
	"King": 10
}

const secretcard	= ah.cards(true)

async function main(interaction, bet, userStats, UID)
{
	const deck = await ch.create(UID)

	if(!deck.success) return eh.error(interaction, deck.reason)

	var	drawn 	= await ch.draw(UID)
	var played 	= false

	let initial;
 		
	const card		= drawn.card
	const emoji     = drawn.emoji
	const points 	= values[card] || card

	const low = new ButtonBuilder()
	.setCustomId("b_low")
	.setLabel("Lower")
	.setStyle(ButtonStyle.Danger)

	const equal = new ButtonBuilder()
	.setCustomId("b_equal")
	.setLabel("Equal")
	.setStyle(ButtonStyle.Secondary)

	const high = new ButtonBuilder()
	.setCustomId("b_high")
	.setLabel("Higher")
	.setStyle(ButtonStyle.Success)

	const row 	= new ActionRowBuilder().addComponents(low, equal, high)
	const embed = new EmbedBuilder()
	.setColor("#259dd9")
	.setTitle("High or Low")
	.setDescription(`1. Card: **${emoji}** \n2. Card: **${secretcard}**`)

	initial = await interaction.editReply({ embeds: [embed], components: [row] })
	
	const press = await new Promise(resolve =>
	{
		const collector = initial.createMessageComponentCollector({ time: 5_000 })

		let resolved = false

		collector.on("collect", async button =>
		{
			if(button.user.id !== UID) return button.reply({ content: "This isn't your game!", ephemeral: true })

			if(resolved) return
			resolved = true

			collector.stop("player")

			resolve(button)
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
		embed
		.setColor('#e80400')
		.setTitle(`You lost!`)
		.setDescription(`You didn't react in time \n\n-# *You've lost ${bet} Chips*`)
		.setFooter({ text: `The house gives you five seconds` });

		await xh.achievements(userStats, userStats.chips + 50, false, 1, 0)
		return end(userStats, interaction, embed, bet, UID)
	}

	await press.deferUpdate()

	const dealer_drawn 	= await ch.draw(UID)

	if(!dealer_drawn.success) return eh.error(interaction, dealer_drawn.reason)

	const dealer_card	= dealer_drawn.card
	const dealer_emoji  = dealer_drawn.emoji
	const dealer_points	= values[dealer_card] || dealer_card

	var reward	= Math.floor(bet / 2) + bet
	var xp_rew	= Math.floor(bet / 7)
	var chosen 	= 0
	var final 	= 0

	if		(press.customId === "b_low")	chosen = 1
	else if	(press.customId === "b_equal")	chosen = 2
	else									chosen = 3

	if		(dealer_points < points) 		final = 1
	else if	(dealer_points === points)		final = 2
	else									final = 3

	if(chosen === 2)	reward = (bet * 2) + Math.floor(bet / 2);

	if(final === chosen)
	{
		embed
		.setColor('#1aa32a')
		.setTitle(`You won!`)
		.setDescription(`1. Card: ${emoji} \n2. Card: ${dealer_emoji} \n\n-# *You won ${reward} Chips*`)

		userStats.chips 		= userStats.chips + reward

		await xh.leveling(userStats, xp_rew)
		await xh.achievements(userStats, userStats.chips - reward, true, 1, reward)
	}
	else
	{
		embed
		.setColor('#e80400')
		.setTitle(`You lost!`)
		.setDescription(`1. Card: ${emoji} \n2. Card: ${dealer_emoji} \n\n-# *You lost ${bet} Chips*`)
		.setFooter({ text: `The house always wins...` });

		await xh.achievements(userStats, userStats.chips, false, 1, 0)
	}

	end(userStats, interaction, embed, bet, UID)
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

	again.setDisabled(true)
	interaction.editReply({ components: [row] })

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
