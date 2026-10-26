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
    let tracker = 2

    embed
    .setTitle("Russian Roulette")
    .setThumbnail(gif)
    .setDescription(`<@${opponentStats.userID}> has to decide \n -#You get 30s before both your wagers are gone`)

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
        const collector = initial.createMessageComponentCollector({ time: 10_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== players[tracker % 2].userID)  return button.reply({ content: "Not your turn!", ephemeral: true})
            if(resolved)                                        return
            if(button.customId === "fold")                      return collector.stop("quit")

                
            button.deferUpdate()
            tracker++
        })

        collector.on("end", (collected, reason) =>
        {
            if(resolved) return

            if(reason === "quit")
            {
                embed.setDescription(`<@${players[tracker % 2].userID} chicken'd out! \n<@${players[(tracker + 1) % 2 ].userID}> wins ${bet}`)
            }
            else if(reason === "died")
            {
                embed.setDescription(`Seems like that's it for <@${players[tracker % 2].userID} \n<@${players[(tracker + 1) % 2 ].userID}> wins ${players[tracker % 2].chips}`)
            }
            else if(reason === "time") embed.setDescription("You both lost ran out of time, \nthe casino keeps your wagers.")

            end(players)

            resolved = true

            resolve(null)
        })
    })
}

async function end([userStats, opponentStats], embed, interaction)
{
    userStats.active_game       = false;
    opponentStats.active_game   = false;

    dh.userSave(userStats)
    dh.userSave(opponentStats)

    interaction.editReply({ embeds: [embed], row: [] })
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
