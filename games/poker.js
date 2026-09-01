const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

const values = 
{
	"ace": 		14,
	"2": 		2,
	"3": 		3,
	"4": 		4,
	"5": 		5,
	"6": 		6,
	"7": 		7,
	"8": 		8,
	"9": 		9,
	"10": 		10,
	"jack": 	11,
	"queen": 	12,
	"king": 	13
}

const multipliers =
{
	"Royal Flush": 		100,
	"Straight Flush": 	20,
	"Four Of A Kind": 	15,
	"Full House": 		10,
	"Flush":  			8,
	"Straight":  		5,
	"Three Of A Kind":  3,
	"Two Pair": 		2,
	"Pair":             1,
}

async function main(interaction, bet, userStats, UID)
{
	if(userStats.chips < bet * 2)
	{
		userStats.chips 		+= bet
		userStats.active_game 	= false

		dh.userSave(UID, userStats)
		return eh.error(interaction, "You need at least 3x your bet to play this game! \n-# Example: You bet 50, you need 150, since calling requires you to put in double your bet");
	}


	const deck 		= await ch.create(UID)
	const xp_rew	= Math.floor(bet / 7)

	if(!deck.success) return eh.error(interaction, deck.reason)

	var	hand				= []
	var hand_str 			= ""
	var dealer_hand			= []
	var dealer_hand_str		= ""
	var community_hand		= []
	var community_hand_str 	= ""
	var winning_hand        = { string: "", name: "" }
	var reward 				= 0
	var played 				= false
	var folded 				= false

	let inital;

	for(let i = 0; i < 2; i++)
	{
		hand_str 			= await player_draw(UID, hand, hand_str)
		dealer_hand_str 	= await dealer_draw(UID, dealer_hand, dealer_hand_str)
	} 

	await ch.burn(UID)

	for(let i = 0; i < 3; i++)
	{
		community_hand_str = await community_draw(UID, community_hand, community_hand_str)
	}

	const call = new ButtonBuilder()
	.setCustomId("b_call")
	.setLabel("Call")
	.setStyle(ButtonStyle.Success)

	const fold = new ButtonBuilder()
	.setCustomId("b_fold")
	.setLabel("Fold")
	.setStyle(ButtonStyle.Danger)

	const row 	= new ActionRowBuilder().addComponents(call, fold)
	const embed = new EmbedBuilder()
	.setColor("#259dd9")
	.setTitle("Casino Hold'em")
	.setDescription(`Dealer: **?? ??**, You: ${hand_str} \n Community cards: ${community_hand_str}`)
	
	try 	{ initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
	catch 	{ dev.log("Failed to respond \n GameID: 8, Error: 1", 2) }

	const pressed	= await initial.createMessageComponentCollector({ time: 30_000 })

	pressed.on('collect', async game =>
	{
		if(game.user.id !== UID) return game.reply({ content: "This isn't your game!", ephemeral: true })

		game.deferUpdate()
		played = true

		if(game.customId === "b_fold")	
		{
			folded = true

			return pressed.stop()	
		}

		await ch.burn(UID)

		for(let i = 0; i < 2; i++)
		{
			community_hand_str = await community_draw(UID, community_hand, community_hand_str)
		}

		embed.setDescription(`Dealer: ${dealer_hand_str}, You: ${hand_str} \n Community cards: ${community_hand_str} \n\n-# *Evaluating...*`)

		pressed.stop()
	})

	pressed.on('end', async collected =>
	{
		call.setDisabled(true)
		fold.setDisabled(true)

		if(!played)
		{
			embed 	
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`You didn't react in time \n\n-# *You've lost ${bet} Chips*`)
			.setFooter({ text: `The house gives you thirty seconds` });

			await xh.achievements(userStats, userStats.chips + 50, false, 8, 0)
		}
		else if(folded)
		{
			embed 	
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`You folded, probably for the better.. \n\n-# *You've lost ${bet} Chips*`)
			.setFooter({ text: `Calling isn't always the best move!` });

			await xh.achievements(userStats, userStats.chips + bet, false, 8, 0)
		}
		else
		{
			try 	{ initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
			catch 	{ dev.log("Failed to respond \n GameID: 8, Error: 2", 2) }

			userStats.chips -= bet * 2

			const player_cards = [...hand, ...community_hand]
			const dealer_cards = [...dealer_hand, ...community_hand]

			const final = await wincon(interaction, player_cards, dealer_cards)

			if(final.won === 0) //lost, dealer had better hand
			{
				embed 	
				.setColor('#e80400')
				.setTitle(`You lost!`)
				.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You've lost ${bet * 3} Chips*`)
				.setFooter({ text: `Calling isn't always a good move!` });

				await xh.achievements(userStats, userStats.chips + (bet * 3), false, 8, 0)
			}
			if(final.won === 1) //won
			{
				reward = (multipliers[final.hands[0]] * bet) + (bet * 2)

				embed 	
				.setColor('#1aa32a')
				.setTitle(`You won!`)
				.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You won ${reward} Chips*`)

				userStats.chips += reward + (bet * 3)
				await xh.leveling(userStats, xp_rew)
				await xh.achievements(userStats, userStats.chips - reward, true, 8, reward, bet, final.hands[0])
			}
			if(final.won === 2) //tied
			{
				embed 	
				.setColor('#f58916')
				.setTitle(`Tied!`)
				.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You didn't lose any Chips*`)
				.setFooter({ text: `Lucky...` });

				userStats.chips += (bet * 3)
				await xh.achievements(userStats, userStats.chips, false, 8, 0)
			}
			if(final.won === 3) //lost, didnt qualify
			{
				embed 	
				.setColor('#e80400')
				.setTitle(`You didn't qualify!`)
				.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You've lost ${bet * 3} Chips*`)
				.setFooter({ text: `Unlucky...` });

				await xh.achievements(userStats, userStats.chips + (bet * 3), false, 8, 0)
			}
		}

		userStats.active_game = false

		await dh.userSave(UID, userStats)
		await ch.remove(UID)

		try 	{ initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
		catch 	{ dev.log("Failed to respond \n GameID: 8, Error: 3", 2) }
	})
}

async function player_draw(UID, hand, hand_str)
{
	const drawn = await ch.draw(UID)

	hand.push(drawn.suited)
	hand_str += (drawn.emoji)

	return hand_str
}

async function dealer_draw(UID, dealer_hand, dealer_hand_str)
{
	const drawn = await ch.draw(UID)

	dealer_hand.push(drawn.suited)
	dealer_hand_str += (drawn.emoji)

	return dealer_hand_str
}

async function community_draw(UID, community_hand, community_hand_str)
{
	const drawn = await ch.draw(UID)

	community_hand.push(drawn.suited)
	community_hand_str += (drawn.emoji)

	return community_hand_str
}

async function calculate(interaction, cards)
{ 
	const sorted = cards.map(card =>
	{
		const suit 	= card.slice(-1)
		const rank 	= card.slice(0, -1).toLowerCase()
		const value = values[rank]

		return { suit, rank, value }
	})

	const counts 	= {}
	const suits 	= { h: [], s: [], d: [], c: [] }

	for(const card of sorted) 
	{
		counts[card.value] = (counts[card.value] || 0) + 1
		suits[card.suit].push(card.value)
	}

	const valuesSorted = sorted.map(c => c.value).sort((a, b) => b - a)
	const countsSorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0])

	//flush
	let fSuit = null

	for(const suit in suits)
	{
		if(suits[suit].length >= 5)
		{
			fSuit = suit
		}
	}

	//stragit + straight flush
	const straight = (valuesSorted) =>
	{
		const unique = [...new Set(valuesSorted)].sort((a, b) => a - b)
 
		for(let i = 0; i <= unique.length - 5; i++)
		{
			const sequence = unique.slice(i, i + 5)

			if(sequence[4] - sequence[0] === 4) return sequence[4]
		}

		if(unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) return 5;

		return null;
	}

	let hand = "High Card", rank = 1, kickers = valuesSorted.slice(0, 5)

	const sFlush = fSuit ? straight(suits[fSuit]) : null

	if(sFlush) 
	{
		if(sFlush === 14) 	return 	{ hand: "Royal Flush", rank: 10, kickers: [sFlush]}
		else 				return 	{ hand: "Straight Flush", rank: 9, kickers: [sFlush]}
	}

	if(countsSorted[0][1] === 4)
	{
		hand 	= "Four Of A Kind"
		rank 	= 8
		const fourKindValue = Number(countsSorted[0][0])
		const kicker = valuesSorted.filter(v => v !== fourKindValue)[0]
		kickers = [fourKindValue, kicker]
	}
	else if(countsSorted[0][1] == 3 && countsSorted[1]?.[1] >= 2)
	{
		hand 	= "Full House"
		rank 	= 7
		kickers = [Number(countsSorted[0][0]), Number(countsSorted[1][0])]
	}
	else if(fSuit)
	{
		hand 	= "Flush"
		rank 	= 6
		kickers = suits[fSuit].sort((a, b) => b - a).slice(0, 5)
	}
	else
	{
		const straightHigh = straight(valuesSorted)

		if(straightHigh)
		{
			hand 	= "Straight"
			rank 	= 5
			kickers = [straightHigh]
		}
		else if(countsSorted[0][1] === 3)
		{
			hand 	= "Three Of A Kind"
			rank 	= 4
			kickers = [Number(countsSorted[0][0]), ...valuesSorted.filter(value => value !== Number(countsSorted[0][0])).slice(0, 2)];
		}
		else if(countsSorted[0][1] === 2 && countsSorted[1]?.[1] === 2)
		{
			hand 	= "Two Pair"
			rank 	= 3
			
			const pair1 = Number(countsSorted[0][0])
			const pair2 = Number(countsSorted[1][0])
			kickers 	= [pair1, pair2, ...valuesSorted.filter(value => value !== pair1 && value !== pair2).slice(0, 1)];
		}
		else if(countsSorted[0][1] === 2)
		{
			hand 	= "Pair"
			rank 	= 2

			const pairVal		= Number(countsSorted[0][0])
			const uniqueKickers = [...new Set(valuesSorted.filter(value => value !== pairVal))]

			kickers = [pairVal, ...uniqueKickers.slice(0, 3)]
		}
	}

	return { hand, rank, kickers }
}

async function wincon(interaction, player_cards, dealer_cards)
{
	const playerFinal = await calculate(interaction, player_cards)
	const dealerFinal = await calculate(interaction, dealer_cards)

	const qualified = qualifier(playerFinal)

	if(!qualified)
	{
		return { won: 3, hands: [playerFinal.hand, dealerFinal.hand] };
	}

	if(playerFinal.rank > dealerFinal.rank) return { won: 1, hands: [playerFinal.hand, dealerFinal.hand] }
	if(playerFinal.rank	< dealerFinal.rank) return { won: 0, hands: [playerFinal.hand, dealerFinal.hand] }

	for(let i = 0; i < Math.min(playerFinal.kickers.length, dealerFinal.kickers.length); i++)
	{
		if(playerFinal.kickers[i] > dealerFinal.kickers[i]) 
		{
			return {won: 1, hands: [playerFinal.hand, dealerFinal.hand] }
		}

		if(playerFinal.kickers[i] < dealerFinal.kickers[i]) 
		{
			return { won: 0, hands: [playerFinal.hand, dealerFinal.hand] }
		}
	}

	return { won: 2, hands: [playerFinal.hand, dealerFinal.hand] }
}

function qualifier(final)
{
	if (final.rank === 1) 	return false;
	else					return true;
}

module.exports =
{

    main,
}
