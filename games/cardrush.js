const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

const values = 
{
	"Ace": 	2,
	"Jack": 11,
	"Queen": 12,
	"King": 13
}

async function main(interaction, bet, userStats, UID)
{
	const deck = await ch.create(UID)

	let round 		= 1
	let last_rew	= 0

	var reward		= (bet * 2) + (bet * round)
	var xp_rew		= Math.floor(bet / 7)

	if(!deck.success) return eh.error(interaction, deck.reason)

	game(interaction, bet, userStats, UID, round, reward, last_rew, xp_rew)
}

async function game(interaction, bet, userStats, UID, round, reward, last_rew, xp_rew)
{
	var	drawn 	= await ch.draw(UID)
	var played 	= false
	var force 	= false
	var cashout = true

	let initial;
	let repeat;
	let remaining;
 		
	const card		= drawn.card
	const emoji     = drawn.emoji
	const points 	= values[card] || card
	remaining 		= drawn.remaining

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
	.setDescription(`You drew a **${emoji}**`)
//
	initial = await interaction.editReply({ embeds: [embed], components:[row] })
	dev.log("Initial reply" + round)

	const press = await new Promise(resolve =>
	{
		const collector = initial.createMessageComponentCollector({ time: 5_000 })

		let resolved = false

		collector.on("collect", async button =>
		{
			dev.log("Button press" + round)
			if(button.user.id !== UID) return button.reply({ content: "This isn't your game!", ephemeral: true })

			if(resolved) return
			resolved = true

			collector.stop("player")

			resolve(button)
		})

		collector.on("end", (collected, reason) =>
		{
			dev.log("Ended" + round + " " + reason)

			if(resolved) return

			resolved = true
			resolve(null)
		})
	})

	low		.setDisabled(true)
	equal	.setDisabled(true)
	high 	.setDisabled(true)

	if(!press)
	{
		dh.userSave(userStats)
		ch.remove(UID)
		xh.achievements(userStats, userStats.chips, false, 9, 0)

		embed
		.setColor('#e80400')
		.setTitle(`You lost!`)
		.setDescription(`You didn't react in time \n\n-# *You lost ${bet} Chips on Round ${round}*`)
		.setFooter({ text: `The house gives you five seconds` });

		await end(userStats)

		try
		{
			await interaction.editReply({ embeds: [embed], components: [row] })
			dev.log("Timed out reply")
		}
		catch 	{ dev.log("Failed to respond \n GameID: 9, Error: 3", 2) }

		return;
	}


	await press.deferUpdate()
	dev.log("Deferred" + round)

	const dealer_drawn 	= await ch.draw(UID)

	if(!dealer_drawn.success) return eh.error(interaction, dealer_drawn.reason)

	const dealer_card	= dealer_drawn.card
	const dealer_emoji  = dealer_drawn.emoji
	const dealer_points	= values[dealer_card] || dealer_card
	remaining			= dealer_drawn.remaining

	var chosen 	= 0
	var final 	= 0

	if(press.customId === "b_low")	chosen = 1
	if(press.customId === "b_equal")	chosen = 2
	if(press.customId === "b_high")	chosen = 3

	if(dealer_points < points) 		final = 1
	if(dealer_points === points)	final = 2
	if(dealer_points > points)		final = 3

	if(chosen === 2)	reward = ((bet * 2) + Math.floor(bet / 2)) + (bet * round);

	dev.log("Decided" + round)

	dev.log(chosen)
	dev.log(final)

	if(final === chosen)
	{
		embed.setColor('#1aa32a').setTitle(`You won!`).setDescription(`You drew a **${emoji}** \nThe dealer drew a **${dealer_emoji}**`)

		dev.log("Correct") + round
	}
	else
	{
		await end(userStats)

		embed.setColor('#e80400').setTitle(`You lost!`).setDescription(`You drew a **${emoji}** \nThe dealer drew a **${dealer_emoji}** \n\n-# *You lost ${bet} Chips on Round ${round}*`).setFooter({ text: `The house always wins...` });

		dh.userSave(userStats)
		ch.remove(UID)
		xh.achievements(userStats, userStats.chips, false, 9, 0)

		try
		{
			await interaction.editReply({ embeds: [embed], components: [row] })
			dev.log("Lost reply")
		}
		catch 	{ dev.log("Failed to respond \n GameID: 9, Error: 3", 2) }

		return;
	}


	round++
	reward 	+= last_rew
	last_rew = reward

	if(round - 1 < 3)
	{
		return game(interaction, bet, userStats, UID, round, reward, last_rew, xp_rew)
	}
	if(remaining <= 10)
	{
		force = true
	}

	const stop = new ButtonBuilder()
	.setCustomId("b_stop")
	.setEmoji("💳")
	.setLabel("Cash out")
	.setStyle(ButtonStyle.Primary)

	const next = new ButtonBuilder()
	.setCustomId('b_next')
	.setEmoji("⚠️")
	.setLabel("Next round")
	.setStyle(ButtonStyle.Primary)

	const row2 	= new ActionRowBuilder().addComponents(stop, next)

	let prompt = await interaction.editReply({ embeds: [embed], components: [row2]})
	dev.log("Cashout reply")

	const last = await new Promise(resolve =>
	{
		const collector = prompt.createMessageComponentCollector({ time: 5_000 })

		let resolved = false

		collector.on("collect", async button =>
		{
			if(button.user.id !== UID) return button.reply({ content: "This isn't your game!", ephemeral: true })

			if(resolved) return
			resolved = true

			if(press.customId === "b_next")	cashout = false
			if(press.customId === "b_stop")	cashout = true

			stop.setDisabled(true)
			next.setDisabled(true)

			try
			{
				await prompt.editReply({ embeds: [embed], components: [row] }).then(press.deferUpdate())
				dev.log("Continue reply")
			}
			catch 	{ dev.log("Failed to respond \n GameID: 9, Error: 5", 2) }

			collector.stop("player")

			resolve(true)
		})

		collector.on("end", (collected, reason) =>
		{
			dev.log("Cashout" + round + " " + reason)

			if(resolved) return

			resolved = true
			resolve(false)
		})
	})

	if(cashout || force)
	{
		if(force)
		{
			reward += bet * 100
			embed.setFooter({ text: `You did it, the stack was done.` })
		}

		embed
		.setColor('#1aa32a')
		.setTitle(`Game's over`)
		.setDescription(`You cashed out & won ${reward}`)

		await end(userStats)

		try
		{
			await interaction.editReply({ embeds: [embed], components: [row] })
			dev.log("Final reply")
		}
		catch 	{ dev.log("Failed to respond \n GameID: 9, Error: 6", 2) }

		userStats.chips += reward

		ch.remove(UID)
		dh.userSave(userStats)
		xh.achievements(userStats, userStats.chips - reward, true, 9, reward)
		xh.leveling(userStats, xp_rew)
	}

	return game(interaction, bet, userStats, UID, round, reward, last_rew, xp_rew)


}

async function end(userStats)
{
	userStats.active_game = false;

	dh.userSave(userStats)

	return;
}

module.exports =
{
    main,
}
