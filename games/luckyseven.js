const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const colors	= ah.colors()
const random 	= new Random()
const wheel     = [ 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7]

async function main(interaction, bet, userStats, UID)
{
	const embed = new EmbedBuilder()
	.setTitle(`Testing`)

	await interaction.editReply({ embeds: [embed], components: [] })

    const final = wheel[random.integer(0, wheel.length - 1)]

    setTimeout(() =>
    {
    	embed.setTitle(`Landed on ${final}`)

		end(userStats, interaction, embed, bet, interaction.user.id)
    }, 3000)

}

async function wincon(payline)
{

}

async function end(userStats, interaction, embed, bet, UID)
{
    userStats.active_game = false;
    dh.userSave(userStats)
    ch.remove(UID)

    initial = await interaction.editReply({ embeds: [embed], components:[] })
}

module.exports =
{
    main,
}
