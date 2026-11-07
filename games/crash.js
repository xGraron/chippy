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
    let mult = random.integer(1, 20) / 10

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
    .setDescription(`Current multiplier: **${mult}** \n-# You get 30s to play`)

    const initial   = await interaction.editReply({ embeds: [embed], components:[row] })
    const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 35_000 })

		collector.on("collect", async button =>
		{
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
            if(reason === "out")        embed.setDescription("Cashout")
            else if(reason === "lost")  embed.setDescription("Lost")

			resolved = true
			resolve(null)
		})
    })

    end(userStats, interaction, embed, bet * mult)
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
