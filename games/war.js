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

    const drawn 	= await ch.draw(UID)
    const card		= drawn.card
    const emoji     = drawn.emoji
    const points 	= values[card] || card

    const fold = new ButtonBuilder()
    .setCustomId("b_fold")
    .setLabel("Surrender")
    .setStyle(ButtonStyle.Danger)

    const play = new ButtonBuilder()
    .setCustomId("b_play")
    .setLabel("Go to war")
    .setStyle(ButtonStyle.Success)

    const row 	= new ActionRowBuilder().addComponents(play, fold)
    const embed = new EmbedBuilder()
    .setTitle("War")
    .setDescription(`Your Card: **${emoji}** \nDealer's Card: **${secretcard}**`)

    let folded = false;

    const initial   = await interaction.editReply({ embeds: [embed], components: [row] })
    const press     = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 5_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== UID) return button.reply({ content: "This isn't your game!", ephemeral: true })

            if(resolved) return
            if(button.customId === "b_fold") return collector.stop("folded")


            resolved = true

            collector.stop("player")

            resolve(button)
        })

        collector.on("end", (collected, reason) =>
        {
            if(resolved) return
            resolved = true

            if(reason === "folded")
            {
                embed
                .setColor(colors.red)
                .setTitle(`You lost!`)
                .setDescription(`Your decided not to go to war and got back half your bet.`)
                .setFooter({ text: `The house always wins...` });

                userStats.chips += Math.floor(bet / 2)
                xh.achievements(userStats, userStats.chips, false, 11, 0)

                return folded = true
            }

            resolve(null)
        })
    })

    if(!press)
    {
        embed
        .setColor(colors.red)
        .setTitle(`You lost!`)
        .setDescription(`You didn't react in time \n\n-# *You've lost ${bet} Chips*`)
        .setFooter({ text: `The house gives you five seconds` });

        await xh.achievements(userStats, userStats.chips + 50, false, 1, 0)
        return end(userStats, interaction, embed, bet, UID)
    }
    if(folded) return end(userStats, interaction, embed, bet, UID);

    await press.deferUpdate()

    const dealer_drawn 	= await ch.draw(UID)

    if(!dealer_drawn.success) return eh.error(interaction, dealer_drawn.reason)

    const dealer_card	= dealer_drawn.card
    const dealer_emoji  = dealer_drawn.emoji
    const dealer_points	= values[dealer_card] || dealer_card

    const reward	= bet * 2
    const xp_rew	= Math.floor(bet / 7)

    if(dealer_points < points)
    {
        embed
        .setColor(colors.green)
        .setTitle(`You won!`)
        .setDescription(`Your Card: ${emoji} \nDealer's Card: ${dealer_emoji} \n\n-# *You won ${reward} Chips*`)

        userStats.chips += reward

        await xh.leveling(userStats, xp_rew)
        await xh.achievements(userStats, userStats.chips - reward, true, 11, reward)
    }
    else
    {
        embed
        .setColor(colors.red)
        .setTitle(`You lost!`)
        .setDescription(`Your Card: ${emoji} \nDealer Card: ${dealer_emoji} \n\n-# *You lost ${bet} Chips*`)
        .setFooter({ text: `The house always wins...` });

        await xh.achievements(userStats, userStats.chips, false, 11, 0)
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
