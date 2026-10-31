const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const random = new Random()
const colors = ah.colors()
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

const secretcard	= ah.cards(true)

async function main(userStats, opponentStats, interaction, embed, bet)
{
	const userID	= userStats.userID
	const oppID		= opponentStats.userID
	const deck 		= await ch.create(userID)
	const players	= [ userStats, opponentStats ]

	let hands 	= {}
	let tracker	= 2
	let current = bet
	let round 	=
	{
		[userID]: bet,
		[oppID]: bet
	}

	let acted = new Set()
	let street = 0

	hands[userID] =
	{
		string: "",
		hand: [],
		contributed: bet
	}
	hands[oppID] =
	{
		string: "",
		hand: [],
		contributed: bet
	}
	hands["community"] =
	{
		string: "",
		hand: []
	}

	if(!deck.success)
	{
		end(userStats, opponentStats)
		return eh.error(interaction, deck.reason)
	}

	for(let i = 0; i < 2; i++)
	{
		hands	= await draw(userID, hands, userID)
		hands	= await draw(userID, hands, oppID)
	}

	for(let i = 0; i < 3; i++)
	{
		hands	= await draw(userID, hands, "community")
	}

	const call = new ButtonBuilder()
	.setCustomId("b_call")
	.setLabel("Call")
	.setStyle(ButtonStyle.Success)

	const fold = new ButtonBuilder()
	.setCustomId("b_fold")
	.setLabel("Fold")
	.setStyle(ButtonStyle.Danger)

	const view = new ButtonBuilder()
	.setCustomId("b_view")
	.setLabel("Click to see your cards")
	.setStyle(ButtonStyle.Secondary)

	const raise = new ButtonBuilder()
	.setCustomId("b_raise")
	.setLabel("Raise")
	.setStyle(ButtonStyle.Danger)

	const row = new ActionRowBuilder().addComponents(call, raise, fold)
	const row2  = new ActionRowBuilder().addComponents(view)

	embed
	.setTitle("Poker")
	.setDescription(`Community cards: \n${hands["community"].string} \n<@${players[tracker % 2].userID}>'s turn \nCurrent pot: ${bet*2} \n\n-# You have 90s to play before the house takes your wagers`)

	const initial	= await interaction.editReply({ embeds: [embed], components: [row, row2] })
	const press		= await new Promise(resolve =>
	{
		const collector = initial.createMessageComponentCollector({ time: 90_000 })
		let resolved = false


		collector.on("collect", async button =>
		{
			if(resolved) return

			if(button.customId === "b_view") 					return button.reply({ content: hands[button.user.id].string, ephemeral: true})
			if(button.user.id !== players[tracker % 2].userID) 	return button.reply({ content: "Not your turn!", ephemeral: true})
			if(button.customId === "b_fold")					return collector.stop("fold")

			const playerID 	= button.user.id
			const player 	= players[tracker % 2]
			const callAmount = current - round[playerID]

			if(button.customId === "b_call")
			{
				if(callAmount > player.chips) return button.reply({ content: "Not enough chips!", ephemeral: true})

				player.chips 				-= callAmount
				round[playerID] 			+= callAmount
				hands[playerID].contributed += callAmount

				acted.add(playerID)
			}

			if(button.customId === "b_raise")
			{
				const raiseAmount 	= bet
				const total 		= callAmount + raiseAmount

				if(total > player.chips) return button.reply({ content: "Not enough chips to raise!", ephemeral: true})

				player.chips 				-= total
				round[playerID] 			+= total
				hands[playerID].contributed += total

				current = round[playerID]

				acted.clear()
				acted.add(playerID)
			}
			else
			{
				await button.deferUpdate()
			}
			if(acted.size === 2 && round[userID] === current && round[oppID] === current)
			{
				street++

				round[userID] 	= 0
				round[oppID]	= 0

				current = 0
				acted.clear()

				if(street === 1 || street === 2)
				{
					hands = await draw(userID, hands, "community")
					tracker = 2
				}
				else
				{
					return collector.stop("showdown")
				}
			}
			else
			{
				tracker++
			}

			embed.setDescription(
				`Community cards: \n${hands["community"].string} \n<@${players[tracker % 2].userID}>'s turn \nCurrent pot: ${hands[userID].contributed + hands[oppID].contributed} Chips`
			)

			await interaction.editReply({ embeds: [embed] })
		})


		collector.on("end", async (collected, reason) =>
		{
			if(resolved) return

			if(reason === "fold")
			{
				const reward = hands[players[tracker % 2].userID].contributed + hands[players[(tracker+ 1) % 2].userID].contributed

				embed.setDescription(`<@${players[tracker % 2].userID}> folded! \n <@${players[(tracker + 1) % 2].userID}> wins the pot of ${reward} Chips`)

				players[(tracker + 1) % 2].chips += reward

				interaction.editReply({ embeds: [embed], components: [] })

				return end(players, userID, embed, interaction,)
			}
			else if(reason === "time")
			{
				embed.setDescription("You took too long. \n The house took your wagers!")

				interaction.editReply({ embeds: [embed], components: [] })
				end(players, userID, embed, interaction)
			}
			else if(reason === "showdown")
			{
				embed.addFields(
					{ name: " ", value: `<@${players[tracker % 2].userID}> ${hands[players[tracker % 2].userID].string}`, inline: true },
					{ name: " ", value: `<@${players[(tracker + 1) % 2].userID}> ${hands[players[(tracker + 1) % 2].userID].string}`, inline: true },
					{ name: "Community cards:", value: hands["community"].string }

				)

				const aFinal = await calculate(interaction, [...hands[players[tracker % 2].userID].hand, ...hands["community"].hand])
				const bFinal = await calculate(interaction, [...hands[players[(tracker + 1) % 2].userID].hand, ...hands["community"].hand])
				const reward = hands[players[tracker % 2].userID].contributed + hands[players[(tracker+ 1) % 2].userID].contributed

				if(aFinal.rank > bFinal.rank) return win_a()
				if(aFinal.rank < bFinal.rank) return win_b()

				for(let i = 0; i < Math.min(aFinal.kickers.length, bFinal.kickers.length); i++)
				{
					if(aFinal.kickers[i] > bFinal.kickers[i]) return win_a()
					if(aFinal.kickers[i] < bFinal.kickers[i]) return win_b()
				}

				const decider = random.integer(0, 1)

				if(decider === 1) players[tracker % 2].chips += reward
				else              players[(tracker % 2) % 2].chips += reward

				function win_a()
				{
					players[tracker % 2].chips += reward

					embed.setDescription(`<@${players[tracker % 2].userID}> wins!`)
					interaction.editReply({ embeds: [embed], components: []})

					end(players, userID, embed, interaction)
				}
				function win_b()
				{
					players[(tracker + 1) % 2].chips += reward

					embed.setDescription(`<@${players[(tracker + 1) % 2].userID}> wins!`)
					interaction.editReply({ embeds: [embed], components: []})

					end(players, userID, embed, interaction)
				}

			}

			resolved = true

			resolve(null)
		})
	})
}

async function end(players, userID, embed, interaction)
{
	players[0].active_game 	= false;
	players[1].active_game	= false;

	ch.remove(userID)
	dh.userSave(players[0])
	dh.userSave(players[1])
}


async function draw(deck, hands, current)
{
	const drawn = await ch.draw(deck)

	hands[current].hand.push(drawn.suited)
	hands[current].string += drawn.emoji

	return hands
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

module.exports =
{
	main,
}
