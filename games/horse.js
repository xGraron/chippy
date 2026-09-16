const { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } 	= require("discord.js")
const { Random }														= require("random-js")
const cnvs  = require('@napi-rs/canvas');
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

const random    = new Random()

const horses =
[
    { name: "⬛ Spades", value: "black"},
    { name: "🟥 Jackie", value: "red"}, 
    { name: "🟨 Giggle", value: "yellow"},
    { name: "🟪 V", value: "purple"},
    { name: "🟧 Juan", value: "orange"},
    { name: "🟩 Hearts", value: "green"},
    { name: "🟫 Dutch", value: "brown"}
]

async function main(interaction, bet, userStats, UID, chosen)
{
    const close     = Math.floor(Date.now() / 1000) + 13
    const winners   = []
    const p_names   = []

    let players = {}
    let initial;

    await addplayer(interaction.user, bet, chosen, players, p_names)

    const menu  = new StringSelectMenuBuilder()
    .setCustomId("Bet")
    .setPlaceholder("Bet on a horse")
    .addOptions(
        ...horses.map(field =>
            new StringSelectMenuOptionBuilder()
            .setLabel(field.name)
            .setValue(field.value)
        )
    )

    const row   = new ActionRowBuilder().addComponents(menu)
    const embed = new EmbedBuilder()
    .setColor("#259dd9")
    .setTitle("Horse race")
    .setThumbnail("https://cdn.discordapp.com/attachments/1381707752409399346/1549853866944634961/horses.webp?ex=6aac3564&is=6aaae3e4&hm=c9456cf7e651854f6fd9fe36a3004b01bab3827bc7047b3979a9da149dd684fd&")
    .setDescription(`*The horses are getting into starting position* \n**Players:** \n${p_names.join(", ")} \n\nBet: ${bet} *(close <t:${close}:R>)*`)

    try     { initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
    catch   { dev.log("Failed to respond \n GameID: 5, Error: 1", 2) }

    const selected  = await initial.createMessageComponentCollector({ time: 14_000 })

    setTimeout(() => 
    {
        menu.setPlaceholder("Bets closed")
        menu.setDisabled(true)

        try     { interaction.editReply({ components: [row] }) }
        catch   { dev.log("Failed to respond \n GameID: 5, Error: 2", 2) }
    }, 13000)

    selected.on('collect', async selection =>
    {
        const s = dh.userGet(selection.user.id)

        if(s.chips < bet)
        {
            selection.reply({ content: "You can't afford to join in", ephemeral: true})
        }
        else if(selection.user.id in players)
        {
            selection.reply({ content: "You already bet on this", ephemeral: true})
        }
        else
        {
            s.active_game   = true
            s.chips         = s.chips - bet
            chosen          = selection.values[0]

            await dh.userSave(selection.user.id, s) 
            await addplayer(selection.user, bet, chosen, players, p_names)

            selection.deferUpdate()

            embed.setDescription(`*The horses are getting into starting position* \n**Players:** \n${p_names.join(", ")} \n\nBet: ${bet} *(close <t:${close}:R>)*`)

            try     { await interaction.editReply({ embeds: [embed] }) }
            catch   { dev.log("Failed to respond \n\n GameID: 5, Error: 3", 2) }
        }
    })

    selected.on('end', async collected =>
    {
        const r         = random.integer(0, 6)
        embed.setDescription(`*The race is on!* \n**Players:** \n${p_names.join(", ")} \n\nBet: ${bet}`)
        embed.setThumbnail("https://cdn.discordapp.com/attachments/1381707752409399346/1549842026382622881/loading.webp?ex=6aac2a5d&is=6aaad8dd&hm=c62c4992e534f03e23f0abd9ee83dcc82cbe04dcced390bb0dcc207d59231d7a&")

        try     { await interaction.editReply({ embeds: [embed] }) }
        catch   { dev.log("Failed to respond \n\n GameID: 5, Error: 4", 2) }

        setTimeout(async ()  => 
        {
            const horse = await race(interaction, embed)

            await getwinners(players, horse, winners, bet)

            if(winners.length === 0)    embed.setDescription(`**Winners:** \n-# *Nobody won*`)
            else                        embed.setDescription(`**Winners:** \n${winners.join(", ")}`)        

            try     { await interaction.editReply({ embeds: [embed] }) }
            catch   { dev.log("Failed to respond \n GameID: 5, Error: 5", 2) }
        }, 3000)
    })
}

async function race(interaction, embed)
{
    const n         = random.integer(0, 6)
    const horse     = horses[n]
    const canvas    = cnvs.createCanvas(256, 256);
    const context   = canvas.getContext('2d');
    const colors    = ["#000000", "#ff0000", "#ffea00", "c800ff", "#ff8800", "#00c903", "#6e4927"]
    
    context.fillStyle       = colors[n]    
    context.font            = '40pt Ubuntu Sans'
    context.textAlign       = 'center'
    context.textBaseline    = 'middle'
    context.fillText(`${(horse.name).slice(2)}`, 128, 64)

    context.fillText("wins!", 128, 128)

    const b = canvas.toBuffer('image/png') 

    embed 
    .setColor("#259dd9")
    .setThumbnail("attachment://image.png")
    .setDescription(`**Winners:** \n-# *Checking for winners*`)

    try     { await interaction.editReply({embeds: [embed], files: [{attachment:b, name:'image.png'}], components: [] }) }
    catch   { dev.log("Failed to respond \n GameID: 5, Error: 6", 2) }

    return horse;
}

async function getwinners(players, horse, winners, bet)
{
    for(const id in players)
    {
        const p = players[id]
        const s = await dh.userGet(id)
        const { value }   = horse
        const { name, bet, chosen } = p

        var won;

        if(value === chosen) won = true;

        if(won === true)
        {
            const xp_rew = Math.floor(bet / 7)
            const reward = bet * 7;

            s.chips += reward 

            winners.push(name)

            await xh.leveling(s, xp_rew)
            await xh.achievements(s, s.chips - reward, true, 5, reward)

            if(chosen === "yellow") await xh.achievements(s, s.chips, false, 503, 0, 0, true);
        }
        else
        {
            await xh.achievements(s, s.chips, false, 5, 0, bet)
        }

        s.active_game = false

        await dh.userSave(id, s)
    }
}

async function addplayer(p, bet, chosen, players, p_names)
{
    players[p.id] = 
    { 
        name: p.username,
        bet: bet,
        chosen: chosen
    }

    p_names.push(p.username)
}


module.exports =
{
    main,
}
