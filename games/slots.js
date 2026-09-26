const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const random 	= new Random()

const statics	= ah.slots()
const gifs 		= ah.slots(true)

async function main(interaction, bet, userStats)
{
	var reels 	= ""
	var final 	= ""
	var payline	= []

	const used 	= []

	const embed = new EmbedBuilder()
	.setColor("#259dd9")
	.setTitle("Slots")
	.setDescription(`${gifs[random.integer(0, gifs.length-1)]}${gifs[random.integer(0, gifs.length-1)]}${gifs[random.integer(0, gifs.length-1)]}`)

	try 	{ initial = await interaction.editReply({ embeds: [embed]}) }
	catch 	{ dev.log("Failed to respond \n GameID: 7, Error: 1", 2) }

	reels = ""

	for(i = 0; i < 3; i++)
	{
		const n = random.integer(0, statics.length - 1)

		final += statics[n]

		payline.push(n)
	}

	const reward = await wincon(payline)
	const xp_rew = Math.floor(reward / 7)

    setTimeout(() => 
    {
    	embed.setDescription(final + "\n-# Two equal ones: 75 Chips \n-# Three equal ones: 500 Chips")

    	if(reward > 0) 	
    	{
    		embed.setColor("#1aa32a")

    		userStats.chips 		+= reward
    		userStats.active_game 	= false

    		xh.leveling(userStats, xp_rew)
    		xh.achievements(userStats, userStats - reward, true, 7, reward)
    	}
    	else 
    	{
    		embed.setColor("#e80400")

    		userStats.active_game 	= false

    		xh.achievements(userStats, userStats - reward, false, 7, reward)
    	}

    	dh.userSave(interaction.user.id, userStats)

        try     { interaction.editReply({ embeds: [embed] }) }
        catch   { dev.log("Failed to respond \n GameID: 7, Error: 2", 2) }
    }, 5000)

}

async function wincon(payline)
{
	const [a, b, c] = payline

	if(a === b && a === c)				return 500;
	if( a === b || b === c || a === c) 	return 75;
	else  								return 0;
}


module.exports =
{
    main,
}
