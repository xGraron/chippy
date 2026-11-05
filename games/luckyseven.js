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

async function main(interaction, bet, userStats)
{
	const embed = new EmbedBuilder()
	.setTitle(`Testing`)

	initial = await interaction.editReply({ embeds: [embed], components: [] })

    setTimeout(() =>
    {
    	embed.setTitle("Testing 2")

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
