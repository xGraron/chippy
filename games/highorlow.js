const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

const values = 
{
	"Ace": 	2,
	"Jack": 10,
	"Queen": 10,
	"King": 10
}

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

	const again = new ButtonBuilder()
	.setCustomId('b_again')
	.setEmoji('🔁')
	.setLabel('Play again?')
	.setStyle(ButtonStyle.Primary)

	const row 	= new ActionRowBuilder().addComponents(low, equal, high)
	const embed = new EmbedBuilder()
	.setColor("#259dd9")
	.setTitle("High or Low")
	.setDescription(`You drew a **${emoji}**`)

	try 	{ initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
	catch 	{ dev.log("Failed to respond \n GameID: 1, Error: 1", 2) }
	
	const pressed	= await initial.createMessageComponentCollector({ time: 5_000 })

	pressed.on('collect', async game =>
	{
		if(game.user.id !== UID) return game.reply({ content: "This isn't your game!", ephemeral: true })

		await game.deferUpdate()

		const dealer_drawn 	= await ch.draw(UID)

		if(!dealer_drawn.success) return eh.error(interaction, dealer_drawn.reason)

		const dealer_card	= dealer_drawn.card
		const dealer_emoji  = dealer_drawn.emoji
		const dealer_points	= values[dealer_card] || dealer_card
		const remaining		= dealer_drawn.remaining

		var reward	= Math.floor(bet / 2) + bet
		var xp_rew	= Math.floor(bet / 7)
		var chosen 	= 0
		var final 	= 0 

		if(game.customId === "b_low")	chosen = 1
		if(game.customId === "b_equal")	chosen = 2
		if(game.customId === "b_high")	chosen = 3

		if(dealer_points < points) 		final = 1
		if(dealer_points === points)	final = 2
		if(dealer_points > points)		final = 3 

		if(chosen === 2)	reward = (bet * 2) + Math.floor(bet / 2);

		played = true

		if(final === chosen) 	
		{
			embed.setColor('#1aa32a').setTitle(`You won!`).setDescription(`You drew a **${emoji}** \nThe dealer drew a **${dealer_emoji}** \n\n-# *You won ${reward} Chips*`)

			userStats.chips 		= userStats.chips + reward

			await xh.leveling(userStats, xp_rew)
			await xh.achievements(userStats, userStats.chips - reward, true, 1, reward)
		}
		else 
		{
			embed.setColor('#e80400').setTitle(`You lost!`).setDescription(`You drew a **${emoji}** \nThe dealer drew a **${dealer_emoji}** \n\n-# *You lost ${bet} Chips*`).setFooter({ text: `The house always wins...` });

			await xh.achievements(userStats, userStats.chips, false, 1, 0)
		}

		try 	{ await interaction.editReply({ embeds: [embed], components: [row] }) }
		catch 	{ dev.log("Failed to respond \n GameID: 1, Error: 2", 2) }

        pressed.stop()
	})

	pressed.on('end', async collected =>
	{
		low.setDisabled(true)
		equal.setDisabled(true)
		high.setDisabled(true)

		if(!played)
		{
			embed 	
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`You didn't react in time \n\n-# *You've lost ${bet} Chips*`)
			.setFooter({ text: `The house gives you five seconds` });	
		}

		try 	{ await interaction.editReply({ embeds: [embed], components: [] }) }
		catch 	{ dev.log("Failed to respond \n GameID: 1, Error: 3", 2) }
		
		userStats.active_game = false

		ch.remove(UID)
		dh.userSave(UID, userStats)
	})
}

module.exports =
{
    main,
}
