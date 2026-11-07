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
    let mult 	= random.integer(1, 20) / 10
	let reward 	= 0

    const hit = new ButtonBuilder()
    .setCustomId("b_hit")
    .setLabel("Try your luck")
    .setStyle(ButtonStyle.Danger)

    const out = new ButtonBuilder()
    .setCustomId("b_out")
    .setLabel("Cash out")
    .setStyle(ButtonStyle.Success)

    const row 	= new ActionRowBuilder().addComponents(hit, out)
    const embed = new EmbedBuilder()
    .setTitle(`Crash`)
    .setDescription(`Current multiplier: **${mult}** \n-# You get 20s to play`)

    const initial   = await interaction.editReply({ embeds: [embed], components:[row] })
    const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 22_000 })

        let resolved;

		collector.on("collect", async button =>
		{
            if(resolved) return
			if(button.user.id !== UID)       return button.reply({ content: "This isn't your game!", ephemeral: true })
            if(button.customId === "b_out")  return collector.stop("out")

            //game logic
            button.deferUpdate()

            if(random.bool(0.2))        mult = 0
            else if(random.bool(0.3))   mult -= random.integer(1, 10) / 10
            else                        mult += random.integer(1, 10) / 10

            if(mult <= 0) return collector.stop("lost")
            else
            {
                embed.setDescription(`Current multiplier: **${mult}** \n-# You get 30s to play`)

                interaction.editReply({ embeds: [embed], components:[row] })
            }
		})

		collector.on("end", (collected, reason) =>
		{
            reward = Math.floor(bet * mult)

            if(reason === "out") 	embed.setDescription(`Cashed out with **x${mult} and won ${reward}`).setColor(colors.green)
            else					embed.setDescription(`You got to greedy and got nothing`).setColor(colors.red)

			if(reward > 50) xh.achievements(userStats, userStats.chips, true, 13, reward)
			else 			xh.achievements(userStats, userStats.chips, false, 13, 0)

			resolved = true
			resolve(null)
		})
    })

	if(!press) embed.setDescription(`You took too long and got nothing`).setColor(colors.red)

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
