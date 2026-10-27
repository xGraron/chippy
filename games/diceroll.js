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
const emojis    = ah.dice()

async function main(interaction, bet, userStats, UID)
{
    var chosen  = 0
    var reward  = 0
    var buttons = []
    var chosen  = {}

    const embed = new EmbedBuilder()
    .setTitle("Roll the Dice")
    .setDescription("Guess the number")

    const even = new ButtonBuilder()
    .setCustomId(`b_even`)
    .setLabel("Even")
    .setStyle(ButtonStyle.Secondary)

    const odd = new ButtonBuilder()
    .setCustomId(`b_odd`)
    .setLabel("Odd")
    .setStyle(ButtonStyle.Secondary)

    const die = new ButtonBuilder()
    .setCustomId(`b_die`)
    .setEmoji("🎲")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true)

    for(let i = 1; i < 7; i++)
    {
         const new_button = new ButtonBuilder()
        .setCustomId(`b_${i}`)
        .setEmoji(emojis[i-1])
        .setStyle(ButtonStyle.Secondary)

        buttons.push(new_button)

        chosen[`b_${i}`] = i
    }

    const row1 = new ActionRowBuilder().addComponents(...buttons.slice(0, 3))
    const row2 = new ActionRowBuilder().addComponents(...buttons.slice(3, 6))
    const row3 = new ActionRowBuilder().addComponents(even, die, odd)


    const initial = await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] })

    const press = await new Promise(resolve => 
    {
        const collector = initial.createMessageComponentCollector({ time: 10_000 })

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

    buttons.forEach(button => { button.setDisabled(true) })
    even.setDisabled(true)
    odd.setDisabled(true)

    const n = random.integer(1, 6)

    if(!press)                          
    {
        chosen = random.integer(1, 6)
        embed.setDescription("You didn't react, \nso Chippy chose for you")
    }
    else
    {
        press.deferUpdate()

        try     { buttons[chosen[press.customId]-1].setStyle(ButtonStyle.Primary) }
        catch   { /*button is even/odd */ }
        try     { buttons[n-1].setStyle(ButtonStyle.Success) }
        catch   { }

        if(n % 2 === 0) even.setStyle(ButtonStyle.Success);
        else            odd.setStyle(ButtonStyle.Success)

        if(n === chosen[press.customId])                    reward = bet * 5
        else if(n % 2 === 0 && press.customId === "b_even") reward = bet * 2
        else if(n % 2 !== 0 && press.customId === "b_odd")  reward = bet * 2

        userStats.chips += reward
    }

    if(reward > 0)  
    {
        embed.setDescription(`You won ${reward} Chips`)

        xh.leveling(userStats, 5)
        xh.achievements(userStats, userStats - reward, true, 10, reward, bet)
    }
    else            
    {
        embed.setDescription("You lost!")
        xh.achievements(userStats, userStats, false, 10, 0, bet)
    }

    end(userStats, interaction, embed, bet, UID, [row1, row2, row3])
}

async function end(userStats, interaction, embed, bet, UID, rows)
{
    userStats.active_game = false;
    dh.userSave(userStats)
    ch.remove(UID)

    initial = await interaction.editReply({ embeds: [embed], components:rows })

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
