const { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } 	= require("discord.js")
const { Random }														= require("random-js")
const cnvs  = require('@napi-rs/canvas');
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

const redNumbers 	= [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];	
const fields 		=  
[
    { name: "Red", value: "red"}, 
    { name: "Black", value: "black"},
    { name: "Even", value: "even"},
    { name: "Odd", value: "odd"},
    { name: "1st 12", value: "1st"},
    { name: "2nd 12", value: "2nd"},
    { name: "3rd 12", value: "3rd"},
    { name: "Zero", value: "green"},
]

async function main(interaction, bet, userStats, UID, chosen)
{
	const close 		= Math.floor(Date.now() / 1000) + 13
	const wheel 		= []
	const winners 		= []
	const p_names		= []

	let players = {}
	let initial;

	for(i = 0; i < 37; i++)
	{
		let type 	= ""

		if 		(i === 0) 					type = "green"
		else if (redNumbers.includes(i))	type = "red"
		else 								type = "black"

		wheel.push({ space: i, type: type })
	}

	await addplayer(interaction.user, bet, chosen, players, p_names)

	const menu 	= new StringSelectMenuBuilder()
	.setCustomId("Bet")
	.setPlaceholder("Join this game of Roulette")
	.addOptions(
		...fields.map(field =>
			new StringSelectMenuOptionBuilder()
			.setLabel(field.name)
			.setValue(field.value)
		)
	)

	const row 	= new ActionRowBuilder().addComponents(menu)
	const embed = new EmbedBuilder()
	.setColor("#259dd9")
	.setTitle("Roulette")
	.setDescription(`*The wheel is spinning* \n**Players:** \n${p_names.join(", ")} \n\nBet: ${bet} *(close <t:${close}:R>)*`)
	.setThumbnail("https://xgraron.github.io/chippy_site/resources/chippy_assets/loading.webp")

	try 	{ initial = await interaction.editReply({ embeds: [embed], components: [row] }) }
	catch 	{ dev.log("Failed to respond \n GameID: 2, Error: 1", 2) }

	const selected	= await initial.createMessageComponentCollector({ time: 15_000 })

	setTimeout(() => 
	{
		menu.setPlaceholder("Bets closed")
		menu.setDisabled(true)

		try 	{ interaction.editReply({ components: [row] }) }
		catch 	{ dev.log("Failed to respond \n GameID: 2, Error: 2", 2) }
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
			s.active_game 	= true
			s.chips 		= s.chips - bet
			chosen 			= selection.values[0]

        	await dh.userSave(selection.user.id, s)	
			await addplayer(selection.user, bet, chosen, players, p_names)

			selection.deferUpdate()

			embed.setDescription(`*The wheel is spinning* \n**Players:** \n${p_names.join(", ")} \n\nBet: ${bet} *(close <t:${close}:R>)*`)

			try 	{ await interaction.editReply({ embeds: [embed] }) }
			catch 	{ dev.log("Failed to respond \n GameID: 2, Error: 3", 2) }
		}
	})

	selected.on('end', async collected =>
	{
		const field = await wheelspin(interaction, wheel, embed)

		await getwinners(players, field, winners)

		if(winners.length === 0)	embed.setDescription(`**Winners:** \n-# *Nobody won*`)
		else  						embed.setDescription(`**Winners:** \n${winners.join(", ")}`)
		

		try 	{ await interaction.editReply({ embeds: [embed] }) }
		catch 	{ dev.log("Failed to respond \n GameID: 2, Error: 4", 2) }
	})
}


async function wheelspin(interaction, wheel, embed)
{
	const random	= new Random()
	const n 		= random.integer(0, 36)
	const field 	= wheel[n]
    const canvas 	= cnvs.createCanvas(256, 256);
    const context 	= canvas.getContext('2d');
    const colors 	= 
	{
		"red": "#ff000a",
		"black": "#000000",
		"green": "#0f6329"
	}
    
    context.fillStyle = colors[field.type]   

    context.beginPath()
    context.arc(128, 128, 128, 0, Math.PI * 2, true)
    context.closePath()
    context.fill()


    context.fillStyle 		= '#ffffff'  
    context.font 			= '130pt Ubuntu Sans'
    context.textAlign 		= 'center'
    context.textBaseline 	= 'middle'
    context.fillText(n, 128, 128)

	const b = canvas.toBuffer('image/png') 

	embed 
	.setColor("#259dd9")
	.setDescription(`**Winners:** \n-# *Checking for winners*`)
    .setThumbnail("attachment://image.png")

	try 	{ await interaction.editReply({embeds: [embed], files: [{attachment:b, name:'image.png'}], components: [] }) }
	catch 	{ dev.log("Failed to respond \n GameID: 2, Error: 5", 2) }

	return field;
}

async function getwinners(players, field, winners)
{
	for(const id in players)
	{
		const p = players[id]
		const s = await dh.userGet(id)
		const { space, type }	= field
		const { name, bet, chosen }	= p

		const won = await wincon(chosen, space, type)

		if(won === true)
		{
			const xp_rew = Math.floor(bet / 7)

			let reward = 0

			if(["red", "black", "even", "odd"].includes(chosen))	reward = bet * 2;
			else if(["1st", "2nd", "3rd"].includes(chosen))			reward = (bet * 2) + Math.floor(bet / 2);
			else if(chosen === "green")								reward = bet * 10;

			s.chips += reward 

			winners.push(name)

			await xh.leveling(s, xp_rew)
			await xh.achievements(s, s.chips - reward, true, 2, reward)
		}
		else
		{
			await xh.achievements(s, s.chips, false, 2, 0, bet)
		}

		s.active_game = false

		await dh.userSave(id, s)
	}
}

async function wincon(chosen, space, type)
{
	switch(chosen)
	{
		case "red": 	return type === chosen;
		case "black": 	return type === chosen;
		case "green": 	return type === chosen;

		case "even": 	return space !== 0 && space % 2 === 0;
		case "odd": 	return space !== 0 && space % 2 !== 0;

		case "1st": 	return space >= 1  && space <= 12;
		case "2nd": 	return space >= 13 && space <= 24;
		case "3rd": 	return space >= 25 && space <= 36;
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
