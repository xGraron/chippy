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
    "Ace": 	1,
    "Jack": 10,
    "Queen": 10,
    "King": 10
}
const facecards		= [	"Jack", "Queen","King" ]
const secretcard	= ah.cards(true)

async function main(interaction, bet, userStats, UID)
{
    const deck 		= await ch.create(UID)
    const xp_rew	= Math.floor(bet / 7)
    const possible  = userStats.chips >= bet

    if(!deck.success) return eh.error(interaction, deck.reason)

    var reward 			= bet * 2
    var player          = 0
    var player_hand_str = ""
    var banker          = 0
    var banker_hand_str = ""
    var chosen          = 0
    var outcome         = 0

    const initial_draw  = await ch.draw(UID)
    const toburn        = values[initial_draw.card] || initial_draw.card

    let inital;

    const bank = new ButtonBuilder()
    .setCustomId("b_bank")
    .setLabel("Bank")
    .setEmoji('🏦')
    .setStyle(ButtonStyle.Secondary)

    const gambler = new ButtonBuilder()
    .setCustomId("b_player")
    .setLabel("Player")
    .setEmoji('🎮')
    .setStyle(ButtonStyle.Secondary)

    const row 	= new ActionRowBuilder().addComponents(bank, gambler)
    const embed = new EmbedBuilder()
    .setColor(colors.blue)
    .setTitle("Baccarat")
    .setDescription(`${initial_draw.emoji}*(${toburn})* cards will be burnt`)

    initial = await interaction.editReply({ embeds: [embed], components: [row] })

    const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 7_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== UID) 	return button.reply({ content: "This isn't your game!", ephemeral: true })

            if(resolved) return
            resolved = true

            if(button.customId === "b_player") chosen = 1

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
        dev.log("Booty")

        return devend(userStats, UID)
    }

    press.deferUpdate()

    await ch.burn(UID, toburn)

    for(let i = 0; i < 2; i++)
    {
        [player, player_hand_str] = await bac_draw(player, player_hand_str, UID);
        [banker, banker_hand_str] = await bac_draw(banker, banker_hand_str, UID)
    }

    while(player < 8 && banker < 8)
    {
        [player, player_hand_str] = await bac_draw(player, player_hand_str, UID);
        [banker, banker_hand_str] = await bac_draw(banker, banker_hand_str, UID)
    }

    const final_str = `Bank: ${banker_hand_str} *(${banker})* \nPlayer: ${player_hand_str} *(${player})* `
    bank.setDisabled(true)
    gambler.setDisabled(true)

    if(player > banker)         outcome = 1
    else if(player === banker)  outcome = 2

    if(outcome === chosen)
    {
        embed
        .setDescription(final_str + `\n-# *You won ${reward} Chips*`)
        .setColor(colors.green)

        userStats.chips += reward
        await xh.leveling(userStats, xp_rew)
    }
    else
    {
        embed
        .setDescription(final_str + `\n-# *You lost*`)
        .setColor(colors.red)
    }

    end(userStats, interaction, embed, bet, UID)
}

module.exports =
{
    main,
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

async function bac_draw(hand, string, UID)
{
    const card = await ch.draw(UID)
    hand    += values[card.card] || card.card
    hand    = hand % 10
    string  += card.emoji

    return [hand, string]
}
