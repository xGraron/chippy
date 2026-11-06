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
const img       = ah.gif("luckyseven")
const wheel     = [ 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7]

async function main(interaction, bet, userStats, UID)
{
	const embed = new EmbedBuilder()
	.setTitle(`Lucky Seven`)
    .setDescription("-# *The wheel is spinning*")
    .setThumbnail(img)

	await interaction.editReply({ embeds: [embed], components: [] })

    const final = wheel[random.integer(0, wheel.length - 1)]
    const reward = await wincon(final, bet)

    setTimeout(() =>
    {
    	embed
    	.setThumbnail(null)
        .setFooter({ text: `The wheel landed on ${final}` });

        if(final === 7)
        {
            embed
            .setDescription(`You won ${reward} Chips`)
            .setColor(colors.green)
        }
        else if(final === 6)
        {
            embed
            .setDescription(`You won nothing, but also lost nothing`)
        }
        else
        {
            embed
            .setDescription(`You lost ${bet - reward} Chips`)
            .setColor(colors.red)
        }

		end(userStats, interaction, embed, reward, interaction.user.id)
    }, 3000)

}

async function wincon(final, bet)
{
    switch(final)
    {
        case 1: return 0
        case 2: return Math.floor(bet / 5)
        case 3: return Math.floor(bet / 3)
        case 4: return Math.floor(bet / 2)
        case 5: return bet - 5
        case 6: return bet
        case 7: return bet * 2
    }
}

async function end(userStats, interaction, embed, reward, UID)
{
    userStats.active_game   = false;
    userStats.chips         += reward;
    dh.userSave(userStats)

    initial = await interaction.editReply({ embeds: [embed], components:[] })
}

module.exports =
{
    main,
}
