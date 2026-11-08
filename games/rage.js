const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const colors = ah.colors()
const values =
{
	"Ace": 	2,
	"Jack": 10,
	"Queen": 10,
	"King": 10
}

const secretcard	= ah.cards(true)

async function main(interaction, bet, userStats, UID)
{
	const deck = await ch.create(UID)

	if(!deck.success) return eh.error(interaction, deck.reason)

	let emojis	= []
	let points  = []
    let between = false

	for(let i = 0; i < 2; i++)
    {
        const drawn = await ch.draw(UID)

        emojis.push(drawn.emojis)
        points.push(values[drawn.card] || drawn.card)
    }

	const yes = new ButtonBuilder()
	.setCustomId("b_yes")
	.setLabel("Between")
	.setStyle(ButtonStyle.Danger)

	const no = new ButtonBuilder()
	.setCustomId("b_no")
	.setLabel("Outside")
	.setStyle(ButtonStyle.Success)

	const row 	= new ActionRowBuilder().addComponents(yes, no)
	const embed = new EmbedBuilder()
	.setTitle("Rage")
	.setDescription(`1. Card: **${emojis[0]}** \n2. Card: **${emojis[1]}**`)

	initial = await interaction.editReply({ embeds: [embed], components: [row] })

	const press = await new Promise(resolve =>
	{
		const collector = initial.createMessageComponentCollector({ time: 5_000 })

		let resolved = false

		collector.on("collect", async button =>
		{
            if(resolved) return
			if(button.user.id !== UID)       return button.reply({ content: "This isn't your game!", ephemeral: true })

            //game logic
            button.deferUpdate()

			if(button.customId === "b_yes")  return collector.stop("yes")
			if(button.customId === "b_no")  return collector.stop("no")
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
        //loss
	}

	end(userStats, interaction, embed, bet, UID)
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
