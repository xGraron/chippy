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
const gif       = ah.gif("cylinder_spin")
const dead      = ah.static("dead")
const blank     = ah.static("blank")

async function main(userStats, opponentStats, interaction, embed, bet)
{
    const players = [ userStats, opponentStats ]
    let track = 2

    embed
    .setTitle("Russian Roulette")
    .setThumbnail(gif)
    .setDescription(`<@${opponentStats.userID}> has to decide`)

    const trigger = new ButtonBuilder()
    .setCustomId("b_trigger")
    .setLabel("Pull the trigger")
    .setStyle(ButtonStyle.Danger)

    const fold = new ButtonBuilder()
    .setCustomId("b_fold")
    .setLabel("Chicken out")
    .setStyle(ButtonStyle.Secondary)

    const row       = new ActionRowBuilder().addComponents(trigger, fold)
    const initial   = await interaction.editReply({ embeds: [embed], components: [row] })
    const press     = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 30_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== players[2 % tracker])  return button.reply({ content: "Not your turn!", ephemeral: true})
            if(resolved)                return
                

            button.deferUpdate()
        })

        collector.on("end", (collected, reason) =>
        {
            if(resolved) return

            resolved = true

            resolve(null)
        })
    })

    end(userStats, opponentStats, embed, interaction)
}

async function end(winStats, loseStats, embed, interaction)
{
    winStats.active_game    = false;
    loseStats.active_game   = false;

    dh.userSave(winStats)
    dh.userSave(loseStats)

    embed.setDescription(`**<@${winStats.userID}> wins!**`)

    interaction.editReply({ embeds: [embed], components: [] })
}

async function folded(winStats, loseStats, hands, userID, embed, interaction, bet)
{
    winStats.active_game    = false;
    winStats.chips          += bet + Math.floor(bet / 2)
    loseStats.active_game   = false;
    loseStats.chips         += Math.floor(bet / 2)

    ch.remove(userID)
    dh.userSave(winStats)
    dh.userSave(loseStats)

    embed.setDescription(`**<@${winStats.userID}> wins** \nbecause <@${loseStats.userID}> folded`)

    interaction.editReply({ embeds: [embed], components: [] })
}

module.exports =
{
    main,
}
