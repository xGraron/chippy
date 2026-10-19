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

async function main(interaction, bet, userStats, UID)
{
    var foot	= "Which side will it land on?"
    var chosen  = 0
    var reward  = 0

    const embed = new EmbedBuilder()
    .setTitle("Coinflip")
    .setThumbnail(gif)
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
            if(button.user.id !== UID) return button.reply({content: "This isn't your game!", ephemeral: true})
            
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
    if(n === chosen) reward = bet + 50

    embed.setThumbnail(statics[n])

    if(reward > 0)
    {
        const xp_rew    = Math.floor(reward / 7)
        foot            = `You won ${reward} Chips`

        embed
        .setColor(colors.green)
        .setFooter({ text: foot });

        userStats.chips 		+= reward
        userStats.active_game 	= false

        xh.leveling(userStats, xp_rew)
        xh.achievements(userStats, userStats - reward, true, 6, reward, bet, n)
    }
    else
    {
        embed
        .setColor(colors.red)
        .setFooter({ text: "One more flip..."})

        userStats.active_game 	= false

        xh.achievements(userStats, userStats - reward, false, 6, reward)
    }

    end(userStats, interaction, embed, bet, UID)
}

async function end(userStats, interaction, embed, bet, UID)
{
    userStats.active_game = false;
    dh.userSave(userStats)
    ch.remove(UID)

    initial = await interaction.editReply({ embeds: [embed], components:[] })

/*
    newStats = await dh.userGet(UID)

    const again = new ButtonBuilder()
    .setCustomId('b_again')
    .setEmoji('🔁')
    .setLabel('Play again?')
    .setStyle(ButtonStyle.Primary)

    const row 	= new ActionRowBuilder().addComponents(again)

    initial = await interaction.editReply({ embeds: [embed], components:[row] })

    const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 7_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== UID) 	return button.reply({ content: "This isn't your game!", ephemeral: true })
            if(newStats.chips < bet)	return button.reply({ content: "You can't afford to play again with this bet!", ephemeral: true })
            if(newStats.active_game) 	return button.reply({ content: "You are already playing a game!", ephemeral: true })

            if(resolved) return
            resolved = true

            collector.stop("player")
            resolve(button)

            resolve(true)
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
        again.setDisabled(true)
        return interaction.editReply({ components: [row] })
    }
    else
    {
        await press.deferUpdate()

        newStats.chips -= bet
        newStats.active_game = true

        dh.userSave(newStats)

        main(interaction, bet, newStats, UID)
    }
*/
}

module.exports =
{
    main,
}
