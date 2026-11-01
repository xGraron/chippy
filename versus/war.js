const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const colors = ah.colors()
const values =
{
    "Ace": 	14,
    "Jack": 11,
    "Queen": 12,
    "King": 13
}

async function main(userStats, opponentStats, interaction, embed, bet)
{
    const players   = [ userStats, opponentStats ]
    const deck = await ch.create(players[0].userID)

    if(!deck.success) return eh.error(interaction, deck.reason)

    let drawn   = await ch.draw(players[0].userID)
    let card	= drawn.card
    let folded  = false

    const emojis    = [ drawn.emoji ]
    const points 	= [ values[card] || card ]

    const fold = new ButtonBuilder()
    .setCustomId("b_fold")
    .setLabel("Surrender")
    .setStyle(ButtonStyle.Danger)

    const play = new ButtonBuilder()
    .setCustomId("b_play")
    .setLabel("Go to war")
    .setStyle(ButtonStyle.Success)

    const row 	= new ActionRowBuilder().addComponents(play, fold)

    embed
    .setTitle("War")
    .setDescription(`<@${players[0].userID}>'s card **${emojis[0]}** \n<@${players[1].userID}> gets to decide`)

    const initial   = await interaction.editReply({ embeds: [embed], components: [row] })
    const press     = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 5_000 })

        collector.on("collect", async button =>
        {
            if(button.user.id !== players[1].userID) return button.reply({content: "Not your turn", ephemeral: true})
            if(button.customId === "b_fold")    collector.stop("folded")
            else                                collector.stop("war")

            button.deferUpdate()
            resolve(button)
        })

        collector.on("end", async (collected, reason) =>
        {
            if(reason === "folded") return folded = true

            let drawn   = await ch.draw(players[0].userID)
            let card	= drawn.card

            emojis.push(drawn.emoji)
            points.push(values[card] || card)


            resolve(null)
        })
    })

    if(!press || folded === true)
    {
        embed.setDescription(`<@${players[1].userID}> chose to surrender \n<@${players[0].userID}> gets half their wager`)
        players[0].chips += bet + Math.floor(bet / 2)
        players[1].chips += Math.floor(bet / 2)
    }
    else
    {
        if(points[0] > points[1])
        {
            embed.setDescription(`<@${players[0].userID}> won! \n${emojis[0]} vs ${emojis[1]}`)
            players[0].chips += bet * 2
        }
        else if(points[0] < points[1])
        {
            embed.setDescription(`<@${players[1].userID}> won! \n${emojis[1]} vs ${emojis[0]}`)
            players[1].chips += bet * 2
        }
        else
        {
            embed.setDescription(`..war never changes..! \n${emojis[0]} vs ${emojis[1]} \n\n-# Equal cards, house takes your wagers`)
        }
    }

    interaction.editReply({ embeds: [embed], components: [] })

    end(players, interaction, embed, bet)
}

async function end(players, interaction)
{
    players[0].active_game  = false;
    players[1].active_game  = false;

    dh.userSave(players[0])
    dh.userSave(players[1])
    ch.remove(players[0].userID)
}

module.exports =
{
    main,
}
