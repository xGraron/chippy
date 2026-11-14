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

async function main(interaction, bet, userStats, UID)
{
    let mult    = random.integer(20, 100) / 10
    let guess 	= 1
	let reward 	= 0

    const up = new ButtonBuilder()
    .setCustomId("1")
    .setLabel("+0.1")
    .setStyle(ButtonStyle.Secondary)

    const up_hard = new ButtonBuilder()
    .setCustomId("5")
    .setLabel("+0.5")
    .setStyle(ButtonStyle.Secondary)

    const out = new ButtonBuilder()
    .setCustomId("b_out")
    .setLabel("Cash out")
    .setStyle(ButtonStyle.Success)

    const row 	= new ActionRowBuilder().addComponents(out, up, up_hard)
    const embed = new EmbedBuilder()
    .setTitle(`Limbo`)
    .setDescription(`Current guess: **${guess}** \n-# You get 20s to play`)

    const initial   = await interaction.editReply({ embeds: [embed], components:[row] })
    const press 	= await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 22_000 })

        let resolved;

		collector.on("collect", async button =>
		{
            if(resolved) return
			if(button.user.id !== UID)     	return button.reply({ content: "This isn't your game!", ephemeral: true })
			if(button.customId === "b_out")	return collector.stop("cashout")

			guess += Number(button.customId) / 10
			if(guess > mult)				return collector.stop("greed")

			embed.setDescription(`Current guess: **${guess}** \n-# You get 20s to play`)

			await interaction.editReply({ embeds: [embed], components:[row] })

			button.deferUpdate()
		})

		collector.on("end", (collected, reason) =>
		{
			if(reason === "time")
			{
				embed
				.setColor(colors.orange)
				.setDescription(`You took too long and have been cashed out at **x${guess}** and won ${reward} Chips \n-# The max was x${mult}!`)
			}
			if(reason === "greed")
			{
				embed
				.setColor(colors.red)
				.setDescription("You greedy person! That's above the limit. \nYou lose your bet.")
			}
			if(reason === "cashout")
			{
				reward = bet * guess

				embed
				.setColor(colors.green)
				.setDescription(`Successfully cashed out at **x${guess}** and won ${reward} Chips. \n-# The max was x${mult}!`)
			}

			resolve(null)
		})
    })

	end(userStats, interaction, embed, reward)
}

async function end(userStats, interaction, embed, reward)
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
