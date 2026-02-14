const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

const values = 
{
	"Ace": 	11,
	"Jack": 10,
	"Queen": 10,
	"King": 10
}
const facecards	= [	"Jack", "Queen","King" ]

async function main(interaction, bet, userStats, UID)
{
	const deck 		= await ch.create(UID)
	const xp_rew	= Math.floor(bet / 7)
	const possible  = userStats.chips >= bet

	if(!deck.success) return eh.error(interaction, deck.reason)

	var reward 			= bet * 2
  	var lost  			= bet
	var	hand			= []
	var hand_em			= []
	var hand_str 		= ""
	var points			= 0
	var dealer_hand		= []
	var dealer_hand_em	= []
	var dealer_hand_str	= ""
	var dealer_points	= 0
	var played 			= false
	var busted			= false
    var doubled 		= false

	let inital;

	for(let i = 0; i < 2; i++)
	{
		points 			= await player_draw(UID, hand, points, hand_em)
		dealer_points 	= await dealer_draw(UID, dealer_hand, dealer_points, dealer_hand_em)
	} 

	hand_str 		= hand_em.join("")
	dealer_hand_str = dealer_hand_em.join("")

	const hit = new ButtonBuilder()
	.setCustomId("b_hit")
	.setLabel("Hit")
	.setStyle(ButtonStyle.Danger)

	const stand = new ButtonBuilder()
	.setCustomId("b_stand")
	.setLabel("Stand")
	.setStyle(ButtonStyle.Success)

	const double = new ButtonBuilder()
	.setCustomId("b_double")
	.setLabel("Double Down")
	.setStyle(ButtonStyle.Secondary)

	const row 	= new ActionRowBuilder().addComponents(hit, stand, double)
	const embed = new EmbedBuilder()
	.setColor("#259dd9")
	.setTitle("Blackjack")
	.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str.split('>')[0]}>, ??**`)
	
	try 	{ initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
	catch 	{ dev.log("Failed to respond \n GameID: 4, Error: 1", 2) }

	const pressed	= await initial.createMessageComponentCollector({ time: 30_000 })

	pressed.on('collect', async game =>
	{
		if(game.user.id !== UID) return game.reply({ content: "This isn't your game!", ephemeral: true });

		if(game.customId === "b_double")
		{
			if(!possible) return game.reply({ content: "You can't afford that!", ephemeral: true });

			userStats.chips -= bet
			
			doubled = true
		}

		game.deferUpdate()

		if(game.customId === "b_stand")	
		{
			played = true

			return pressed.stop()	
		}

		if(points === 17) await xh.achievements(userStats, userStats.chips, false, 404, 0, 0, true)

		points 		= await player_draw(UID, hand, points, hand_em)
		hand_str 	= hand_em.join("")

		embed.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str.split('>')[0]}>, ??**`)

		try 	{ await interaction.editReply({ embeds: [embed] }) }
		catch 	{ dev.log("Failed to respond \n GameID: 4, Error: 2", 2) }

		if(points > 21)						
		{
			played = true
			busted = true

			return pressed.stop()
		}
		else if(doubled)
		{
			played = true

			return pressed.stop()
		}
	})

	pressed.on('end', async collected =>
	{
		hit		.setDisabled(true)
		stand	.setDisabled(true)
		double	.setDisabled(true)

		if(!played)
		{
			embed 	
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`You didn't react in time \n\n-# *You've lost ${bet} Chips*`)
			.setFooter({ text: `The house gives you thirty seconds` });

			await xh.achievements(userStats, userStats.chips, false, 4, 0)
		}

		while(dealer_points < 17)
		{
			dealer_points	= await dealer_draw(UID, dealer_hand, dealer_points, dealer_hand_em)
			dealer_hand_str = dealer_hand_em.join("")
		}

		if(busted)
		{
			if(doubled) lost = lost * 2;

			embed 	
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str}** *(${dealer_points}p)* \n\n-# *You've lost ${lost} Chips*`)
			.setFooter({ text: `The house always wins...` });

			await xh.achievements(userStats, userStats.chips, false, 4, 0)
		}
		else if(dealer_points > 21)
		{
			if(doubled) reward = reward * 2;

			embed 	
			.setColor('#1aa32a')
			.setTitle(`You won!`)
			.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str}** *(${dealer_points}p)* \n\n-# *You won ${reward} Chips*`)

			userStats.chips = userStats.chips + reward
			await xh.leveling(userStats, xp_rew)
			await xh.achievements(userStats, userStats.chips - reward, true, 4, reward)
		}
		else if(points > dealer_points)
		{
			if(doubled) reward = reward * 2;

			embed 	
			.setColor('#1aa32a')
			.setTitle(`You won!`)
			.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str}** *(${dealer_points}p)* \n\n-# *You won ${reward} Chips*`)

			userStats.chips = userStats.chips + reward
			await xh.leveling(userStats, xp_rew)
			await xh.achievements(userStats, userStats.chips - reward, true, 4, reward)
		}
		else if(points === dealer_points)
		{
			embed 	
			.setColor('#f58916')
			.setTitle(`Push!`)
			.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str}** *(${dealer_points}p)* \n\n-# *You didn't lose any Chips*`)
			.setFooter({ text: `Lucky...` });

			userStats.chips = userStats.chips + bet
			await xh.achievements(userStats, userStats.chips, false, 4, 0)
		}
		else
		{
			if(doubled) lost = lost * 2;

			embed 	
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`Your hand: **${hand_str}** *(${points}p)* \nDealer's hand: **${dealer_hand_str}** *(${dealer_points}p)* \n\n-# *You lost ${lost} Chips*`)
			.setFooter({ text: `The house always wins...` });

			await xh.achievements(userStats, userStats.chips, false, 4, 0)
		}

		try 	{ interaction.editReply({ embeds: [embed], components: [row] })	}
		catch 	{ dev.log("Failed to respond \n GameID: 4, Error: 3", 2) }

		userStats.active_game = false

		ch.remove(UID)
		dh.userSave(UID, userStats)
	})
}

async function player_draw(UID, hand, points, hand_em)
{
	const drawn = await ch.draw(UID)

	hand.push(drawn.card)
	hand_em.push(drawn.emoji)

	return calculate(hand)
}

async function dealer_draw(UID, dealer_hand, dealer_points, dealer_hand_em)
{
	const drawn = await ch.draw(UID)

	dealer_hand.push(drawn.card)
	dealer_hand_em.push(drawn.emoji)

	//this line shouldnt matter
	//dealer point need to be equal to whatever "calculate" function returns
	//according to what I see, thats the case
	//so setting dealer points in here has no impact since it seems
	//a) wrong, b) to get overwritten anyway?
	//dealer_points 	+= values[drawn.card] || drawn.card

	return calculate(dealer_hand)
}

async function calculate(hand)
{
	let total	= 0
	let aces 	= 0

	for(let card of hand)
	{
		if(card === "Ace")
		{
			total += 11
			aces ++
		}
		else total += values[card] || card;
	}

	while (total > 21 && aces > 0)
	{
		total -= 10
		aces --
	}

	return total
}

module.exports =
{
    main,
}