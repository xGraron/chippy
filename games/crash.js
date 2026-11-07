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
    let mult = random.integer(1, 10) / 10

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
    .setDescription("Current multiplier: " + mult)

    const initial   = await interaction.editReply({ embeds: [embed], components:[row] })
    const press     = await new Promise(resolve =>
    {
		collector.on("collect", async button =>
		{
			if(button.user.id !== UID) return button.reply({ content: "This isn't your game!", ephemeral: true })

			if(resolved) return
			resolved = true

            //game logic
            button.deferUpdate()
		})

		collector.on("end", (collected, reason) =>
		{
			if(resolved) return

            if(reason === "out")        embed.setDescription("Cashout")
            else if(reason === "lost")  embed.setDescription("Lost")

			resolved = true
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
