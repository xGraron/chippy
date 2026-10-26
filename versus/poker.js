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

const secretcard	= ah.cards(true)

async function main(userStats, opponentStats, interaction, embed, bet)
{
    const deck 		= await ch.create(userStats.userID)
    const userID    = userStats.userID
    const oppID     = opponentStats.userID
	const xp_rew	= Math.floor(bet / 7)

	if(!deck.success)
    {
        end(userStats, opponentStats)
        return eh.error(interaction, deck.reason)
    }

	var hands = {}

	hands[userID] =
    {
        hand: [],
        str: "",
        contributed: bet
    }
    hands[oppID] =
    {
        hand: [],
        str: "",
        contributed: bet
    }
    hands["community"] =
    {
        hand: [],
        str: ""
    }

	for(let i = 0; i < 2; i++)
	{
		hands = await draw(userID, userID, hands)
		hands = await draw(userID, oppID, hands)
    }

	await ch.burn(userID)

    for(let i = 0; i < 5; i++)
    {
        hands = await await draw(userID, "community", hands)
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

	const row 	= new ActionRowBuilder().addComponents(call, fold)
    const row2  = new ActionRowBuilder().addComponents(view)

	embed
	.setTitle("Poker")
	.setDescription(`Community cards: \n${hands["community"].str} \n\n-# <@${opponentStats.userID}>'s turn`)

    const aFinal = await calculate(interaction, [...hands[userID].hand, ...hands["community"].hand])
    const bFinal = await calculate(interaction, [...hands[oppID].hand, ...hands["community"].hand])

    dev.log(aFinal)
    dev.log(bFinal)

    if(aFinal.rank > bFinal.rank)  return end(userStats, opponentStats, hands, userID, embed, interaction, bet)
    if(aFinal.rank < bFinal.rank)  return end(opponentStats, userStats, hands, userID, embed, interaction, bet)

    for(let i = 0; i < Math.min(aFinal.kickers.length, bFinal.kickers.length); i++)
    {
        if(aFinal.kickers[i] > bFinal.kickers[i])
        {
            return end(userStats, opponentStats, hands, userID, embed, interaction, bet)
        }

        if(aFinal.kickers[i] < bFinal.kickers[i])
        {
            return end(opponentStats, userStats, hands, userID, embed, interaction, bet)
        }
    }

    const decider = random.integer(0, 1)

    if(decider === 1) return end(userStats, opponentStats, hands, userID, embed, interaction, bet, true)
    else              return end(opponentStats, userStats, hands, userID, embed, interaction, bet, true)

}

async function end(winStats, loseStats, hands, userID, embed, interaction, bet, tie)
{
    winStats.active_game    = false;
    winStats.chips          += bet * 2
    loseStats.active_game   = false;

    ch.remove(userID)
    dh.userSave(winStats)
    dh.userSave(loseStats)

    embed.setDescription(`**<@${winStats.userID}> wins!**`)
    embed.addFields(
        { name: `Winner`, value: hands[winStats.userID].str, inline: true },
        { name: `Loser`, value: hands[loseStats.userID].str, inline: true },
        { name: `Community cards`, value: hands["community"].str }
    )
    if(tie) embed.setFooter({ text: 'It was a tie! Winner was decided by random' });

    interaction.editReply({ embeds: [embed], components: [] })
}

async function draw(deck, ID, hands)
{
    const drawn = await ch.draw(deck)

    hands[ID].hand.push(drawn.suited)
    hands[ID].str += drawn.emoji

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
