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
	const deck 		= await ch.create(UID, 1, "royal")
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
	.setTitle("Casino Hold'em")
	.setDescription(`Dealer: **${secretcard}${secretcard}**, You: ${hand_str} \n Community cards: ${community_hand_str}`)
	
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

		await xh.achievements(userStats, userStats.chips + bet, false, 8, 0)
		return end(userStats, interaction, embed, bet, UID)
	}

	await ch.burn(UID)

	for(let i = 0; i < 2; i++)
	{
		community_hand_str = await community_draw(UID, community_hand, community_hand_str)
	}

	const player_cards 	= [...hand, ...community_hand]
	const dealer_cards 	= [...dealer_hand, ...community_hand]
	const final 		= await wincon(interaction, player_cards, dealer_cards)

	if(final.won === 0) //lost, dealer had better hand
	{
		embed
		.setColor('#e80400')
		.setTitle(`You lost!`)
		.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You've lost ${bet} Chips*`)
		.setFooter({ text: `Calling isn't always a good move!` });

		await xh.achievements(userStats, userStats.chips + (bet * 3), false, 15, 0)
	}
	else if(final.won === 1) //won
	{
		reward = bet * 2

		embed
		.setColor('#1aa32a')
		.setTitle(`You won!`)
		.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You won ${reward} Chips*`)

		userStats.chips += reward
		await xh.leveling(userStats, xp_rew)
		await xh.achievements(userStats, userStats.chips - reward, true, 15, reward, bet, final.hands[0])
	}
	else if(final.won === 2) //tied
	{
		embed
		.setColor('#f58916')
		.setTitle(`Tied!`)
		.setDescription(`Dealer: ${dealer_hand_str} *(${final.hands[1]})*, You: ${hand_str} *(${final.hands[0]})* \n Community cards: ${community_hand_str} \n\n-# *You didn't lose any Chips*`)
		.setFooter({ text: `Lucky...` });

		userStats.chips += bet
		await xh.achievements(userStats, userStats.chips, false, 15, 0)
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
	const playerFinal = await ch.calculate(player_cards, values)
	const dealerFinal = await ch.calculate(dealer_cards, values)

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
*/
}

module.exports =
{

    main,
}
