const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../../handlers/dataHandler.js")
const eh 	= require("../../handlers/errorHandler.js")
const ch    = require('../../handlers/cardHandler.js')
const xh	= require('../../handlers/xpHandler.js')
const dev   = require('../../handlers/dev.js')
const ah	= require('../../handlers/assetHandler.js')

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

async function main(interaction, bet, userStats, UID)
{
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
		var folded 				= false

		let inital;

		for(let i = 0; i < 3; i++)
		{
			hand_str 			= await player_draw(UID, hand, hand_str)
			dealer_hand_str 	= await dealer_draw(UID, dealer_hand, dealer_hand_str)
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
		.setTitle("Casino Hold'em")
		.setDescription(`Dealer: **${secretcard}${secretcard}${secretcard}**, You: ${hand_str}`)

		initial = await interaction.editReply({ embeds: [embed], components: [row] })

		const press = await new Promise(resolve =>
		{
			const collector = initial.createMessageComponentCollector({ time: 7_000 })

			let resolved = false

			collector.on("collect", async button =>
			{
				if(button.user.id !== UID) 	return button.reply({ content: "This isn't your game!", ephemeral: true})
				if(resolved) 				return

				if(button.customId === "b_fold") folded = true

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

		call.setDisabled(true)
		fold.setDisabled(true)

		if(!press) folded = true

		try 	{ await press.deferUpdate() }
		catch	{ /* user didnt react in time */ }
		if(folded)
		{
			embed
			.setColor('#e80400')
			.setTitle(`You folded!`)
			.setDescription(`Probably for the better.. \n\n-# *You've lost ${Math.floor(bet / 2)} Chips*`)
			.setFooter({ text: `Calling isn't always the best move!` });

			userStats.chips += Math.floor(bet / 2)

			await xh.achievements(userStats, userStats.chips + bet, false, 16, 0)
			return end(userStats, interaction, embed, bet, UID)
		}

		await ch.burn(UID)

		const final 		= await wincon(interaction, hand, dealer_hand)

		if(final.won === 0) //lost, dealer had better hand
		{
			embed
			.setColor('#e80400')
			.setTitle(`You lost!`)
			.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})*`)
			.setFooter({ text: `Calling isn't always a good move!` });

			await xh.achievements(userStats, userStats.chips + (bet * 3), false, 16, 0)
		}
		else if(final.won === 1) //won
		{
			reward = bet * 2

			embed
			.setColor('#1aa32a')
			.setTitle(`You won!`)
			.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})*`)

			userStats.chips += reward
			await xh.leveling(userStats, xp_rew)
			await xh.achievements(userStats, userStats.chips - reward, true, 16, reward, bet)
		}
		else if(final.won === 2) //tied
		{
			embed
			.setColor('#f58916')
			.setTitle(`Tied!`)
			.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})*`)
			.setFooter({ text: `Lucky...` });

			userStats.chips += bet
			await xh.achievements(userStats, userStats.chips, false, 16, 0)
		}

		return end(userStats, interaction, embed, bet, UID)
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

async function wincon(interaction, player_cards, dealer_cards)
{
	const playerFinal = await calculate(player_cards, values)
	const dealerFinal = await calculate(dealer_cards, values)

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


async function end(userStats, interaction, embed, bet, UID)
{
	userStats.active_game = false;
	dh.userSave(userStats)
	ch.remove(UID)

	initial = await interaction.editReply({ embeds: [embed], components:[] })

	/*
	 *    newStats = await dh.userGet(UID)
	 *
	 *    const again = new ButtonBuilder()
	 *    .setCustomId('b_again')
	 *    .setEmoji('🔁')
	 *    .setLabel('Play again?')
	 *    .setStyle(ButtonStyle.Primary)
	 *
	 *    const row 	= new ActionRowBuilder().addComponents(again)
	 *
	 *    initial = await interaction.editReply({ embeds: [embed], components:[row] })
	 *
	 *    const press = await new Promise(resolve =>
	 *    {
	 *        const collector = initial.createMessageComponentCollector({ time: 7_000 })
	 *
	 *        let resolved = false
	 *
	 *        collector.on("collect", async button =>
	 *        {
	 *            if(button.user.id !== UID) 	return button.reply({ content: "This isn't your game!", ephemeral: true })
	 *            if(newStats.chips < bet)	return button.reply({ content: "You can't afford to play again with this bet!", ephemeral: true })
	 *            if(newStats.active_game) 	return button.reply({ content: "You are already playing a game!", ephemeral: true })
	 *
	 *            if(resolved) return
	 *            resolved = true
	 *
	 *            collector.stop("player")
	 *            resolve(button)
	 *
	 *            resolve(true)
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
*/
}

async function calculate(cards, values)
{
    const sorted = cards.map(card =>
    {
        const suit = card.slice(-1).toLowerCase()
        const rank = card.slice(0, -1).toLowerCase()
        const value = values[rank]

        if(value === undefined)
            throw new Error(`Invalid card rank: ${rank}`)

        return { suit, rank, value }
    })

    const valuesSorted = sorted
        .map(c => c.value)
        .sort((a, b) => b - a)

    const counts = {}

    for(const card of sorted)
    {
        counts[card.value] = (counts[card.value] || 0) + 1
    }

    const countsSorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || b[0] - a[0])

    const isFlush = sorted.every(c => c.suit === sorted[0].suit)

    // Check straight
    const unique = [...new Set(valuesSorted)]
        .sort((a, b) => a - b)

    let straightHigh = null

    if(unique.length === 3)
    {
        if(unique[2] - unique[0] === 2)
        {
            straightHigh = unique[2]
        }

        // Ace-low straight: A, 2, 3
        else if(
            unique.includes(14) &&
            unique.includes(2) &&
            unique.includes(3)
        )
        {
            straightHigh = 3
        }
    }

    const isStraight = straightHigh !== null

    let hand = "High Card"
    let rank = 1
    let kickers = valuesSorted

    // Straight Flush
    if(isStraight && isFlush)
    {
        hand = "Straight Flush"
        rank = 6
        kickers = [straightHigh]
    }

    // Three of a Kind
    else if(countsSorted[0][1] === 3)
    {
        hand = "Three Of A Kind"
        rank = 5
        kickers = [Number(countsSorted[0][0])]
    }

    // Straight
    else if(isStraight)
    {
        hand = "Straight"
        rank = 4
        kickers = [straightHigh]
    }

    // Flush
    else if(isFlush)
    {
        hand = "Flush"
        rank = 3
        kickers = valuesSorted
    }

    // Pair
    else if(countsSorted[0][1] === 2)
    {
        hand = "Pair"
        const pairValue = Number(countsSorted[0][0])

        rank = 2

        kickers = [
            pairValue,
            ...valuesSorted.filter(v => v !== pairValue)
        ]
    }

    return { hand, rank, kickers }
}


module.exports =
{

	main,
}
