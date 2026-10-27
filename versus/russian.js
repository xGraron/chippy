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
    .setDescription(`<@${players[tracker % 2].userID}> has to go first \n-# You get 30s before both your wagers are gone`)
    .setFooter({ text: 'LOSING WILL RESET YOUR PROGRESS' })

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
            if(button.user.id !== players[tracker % 2].userID)  return button.reply({ content: "Not your turn!", ephemeral: true})
            if(resolved)                                        return

            if(button.customId === "b_fold")
            {
                button.deferUpdate()
                return collector.stop("quit")
            }

            if(random.bool(0.16))
            {
                button.reply({ content: "Truth is, the game was rigged from the start!", ephemeral: true})
                return collector.stop("died")
            }

            embed.setDescription(`<@${players[(tracker + 1) % 2].userID}>'s turn`)

            button.reply({ content: "You're save", ephemeral: true})
            await interaction.editReply({ embeds: [embed]})

            tracker++
        })

        collector.on("end", (collected, reason) =>
        {
            if(resolved) return
            if(reason === "quit")
            {
                embed.setDescription(`<@${players[tracker % 2].userID}> chicken'd out! \n<@${players[(tracker + 1) % 2 ].userID}> wins ${bet} Chips`)
                embed.setThumbnail(null)

                players[(tracker + 1) % 2 ].chips += bet * 2
            }
            else if(reason === "died")
            {
                if(players[tracker % 2].inventory.includes("i1"))
                {
                    players[tracker % 2].inventory.splice(players[tracker % 2].inventory.indexOf("i1"), 1)
                    players[(tracker + 1) % 2 ].chips += bet * 2

                    embed.setDescription(`Seems like <@${players[tracker % 2].userID}> loaded a blank \n<@${players[(tracker + 1) % 2 ].userID}> takes the wager of ${bet} Chips`)
                    embed.setThumbnail(blank)
                }
                else
                {
                    embed.setDescription(`Seems like that's it for <@${players[tracker % 2].userID}> \n<@${players[(tracker + 1) % 2 ].userID}> wins ${players[tracker % 2].chips}`)
                    embed.setThumbnail(dead)

                    players[(tracker + 1) % 2].chips += players[tracker % 2].chips

                    players[tracker % 2].xp = 0
                    players[tracker % 2].level = 1
                    players[tracker % 2].chips = 0
                    players[tracker % 2].inventory = []
                    players[tracker % 2].games = {}

                    if(!players[tracker % 2].achievements.includes("90")) players[tracker % 2].achievements.push("90")
                }
            }
            else if(reason === "time") embed.setDescription("You both ran out of time, \nthe casino keeps your wagers.")

            end(players, embed, interaction, tracker)

            resolved = true

            resolve(null)
        })
    })
}

async function end(players, embed, interaction, tracker)
{
    embed.setFooter({ text: ' ' })

    players[0].active_game       = false;
    players[1].active_game       = false;

    dh.userSave(players[0])
    dh.userSave(players[1])

    interaction.editReply({ embeds: [embed], components: [] })
}

module.exports =
{
    main,
}
