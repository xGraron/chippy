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
const statics	= [ah.static("coin0"), ah.static("coin1")]
const emojis    = ah.coins()
const gif		= ah.gif("coins")

async function main(userStats, opponentStats, interaction, embed, bet)
{
    var foot	= "Which side will it land on?"
    var chosen  = 0
    var reward  = 0
    var winne   = 0

    embed
    .setTitle("Coinflip")
    .setThumbnail(gif)
    .setDescription(`<@${opponentStats.userID}> gets to call it`)
    .setFooter({ text: foot });

    const heads = new ButtonBuilder()
    .setCustomId("b_heads")
    .setLabel("Heads")
    .setEmoji(emojis[0])
    .setStyle(ButtonStyle.Secondary)

    const tails = new ButtonBuilder()
    .setCustomId("b_tails")
    .setLabel("Tails")
    .setEmoji(emojis[1])
    .setStyle(ButtonStyle.Secondary)

    const row       = new ActionRowBuilder().addComponents(heads, tails)
    const initial   = await interaction.editReply({ embeds: [embed], components: [row] })

        const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 5_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== opponentStats.userID) return button.reply({content: "It's not your turn", ephemeral: true})

            if(resolved) return
            resolved = true

            collector.stop("player")

            resolve(button)
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
        chosen = random.integer(0, 1)
        embed.setDescription("You didn't react, \nso Chippy chose for you")
    }
    else
    {
        press.deferUpdate()
        if(press.customId === "b_tails") chosen = 1
    }

    const n = random.integer(0, 1)
    if(n === chosen)    winner = opponentStats.userID;
    else                winner = userStats.userID;

    embed.setThumbnail(statics[n])
    embed.setDescription(`<@${winner}> wins!`)

    dev.log(winner)

    interaction.editReply({ embeds: [embed], row: [] })

    end(userStats, opponentStats, interaction, embed, bet)
}

async function end(userStats, opponentStats, interaction)
{
    userStats.active_game       = false;
    opponentStats.active_game   = false;

    dh.userSave(userStats)
    dh.userSave(opponentStats)
}

module.exports =
{
    main,
}
