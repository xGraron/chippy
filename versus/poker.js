const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

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
    const did       = userStats.userID
	const xp_rew	= Math.floor(bet / 7)

	if(!deck.success)
    {
        end(userStats, opponentStats)
        return eh.error(interaction, deck.reason)
    }

	var winning_hand   = { string: "", name: "" }
	var winner         = 0
	var hands          = {}

	let inital;

    hands[userStats.userID] =
    {
        hand: [],
        str: ""
    }
    hands[opponentStats.userID] =
    {
        hand: [],
        str: ""
    }
    hands["community"] =
    {
        hand: [],
        str: ""
    }

	for(let i = 0; i < 2; i++)
	{
		hands = await draw(did, userStats.userID, hands)
		hands = await draw(did, opponentStats.userID, hands)
    }

	await ch.burn(did)

    for(let i = 0; i < 3; i++)
    {
        hands = await await draw(did, "community", hands)
    }

    dev.log(hands)


	const call = new ButtonBuilder()
	.setCustomId("b_call")
	.setLabel("Call")
	.setStyle(ButtonStyle.Success)

    const raise = new ButtonBuilder()
    .setCustomId("b_raise")
    .setLabel("Raise")
    .setStyle(ButtonStyle.Danger)

	const fold = new ButtonBuilder()
	.setCustomId("b_fold")
	.setLabel("Fold")
	.setStyle(ButtonStyle.Danger)

    const view = new ButtonBuilder()
    .setCustomId("b_view")
    .setLabel("Click to see your cards")
    .setStyle(ButtonStyle.Secondary)

	const row 	= new ActionRowBuilder().addComponents(call, fold, raise)
    const row2  = new ActionRowBuilder().addComponents(view)

	embed
	.setTitle("Casino Hold'em")
	.setDescription(`Community cards: \n${hands["community"].str} \n\n-# <@${opponentStats.userID}>'s turn`)

    initial = await interaction.editReply({ embeds: [embed], components: [row, row2] })

    })

    end(userStats, opponentStats)
}


async function draw(deck, ID, hands)
{
    const drawn = await ch.draw(deck)

    hands[ID].hand.push(drawn.suited)
    hands[ID].str += drawn.emoji

    return hands
}

async function end(userStats, opponentStats)
{
    userStats.active_game       = false;
    opponentStats.active_game   = false;

    ch.remove(userStats.userID)
    dh.userSave(userStats)
    dh.userSave(opponentStats)
}

module.exports =
{
    main,
}
