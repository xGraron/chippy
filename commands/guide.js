const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js")	
const fs	= require('fs')
const path	= require('path')
const dev   = require('../handlers/dev.js')

const filePath      = path.join("database/", 'guide.txt')   
const fileContent   = fs.readFileSync(filePath, 'utf-8')   
const array         = fileContent.split('S P L I T')   

var games =  
[
    { name: "High or Low", value: "1"}, 
    { name: "Roulette", value: "2"},
    { name: "Blackjack", value: "4"},
    { name: "Horse races", value: "5"},
    { name: "Slots", value: "7"},
    { name: "Poker", value: "8"},
    { name: "Card Rush", value: "9"},
]

module.exports = 
{
	data: new SlashCommandBuilder()
	.setName("guide")
	.setDescription("See how things work")
	.addStringOption(option => option
		.setName("game")
		.setDescription("Tips for a specific game")
		.setRequired(false)
		.addChoices(games)
	),

	async execute(interaction, userStats)
	{
		const initial 	= await interaction.deferReply()

		const embed 	= new EmbedBuilder()
		const menu 		= new StringSelectMenuBuilder()
		.setCustomId("Switch page")
		.setPlaceholder("Get help about something else")
		.addOptions(
			new StringSelectMenuOptionBuilder()
			.setLabel("Overview")
			.setValue("0"),
			...games.map(game =>
				new StringSelectMenuOptionBuilder()
				.setLabel(game.name)
				.setValue(game.value)
			)
		)

		const row = new ActionRowBuilder().addComponents(menu)

		var chosen 	= interaction.options.getString("game") || "0"
		var final	= array[chosen]

		if(chosen[0] === "2")	embed.setImage('https://cdn.discordapp.com/attachments/1242636042469642300/1381666818615410808/Chippy_board.png?ex=684858ff&is=6847077f&hm=6890eb460fd71f05b00f0379a5ab9691451b3b19c9f0f2c6e6ce9fd7633afd35&')
		else            		embed.setImage(null)

		sendEmbed()

		const selected	= await initial.createMessageComponentCollector({ time: 30_000 })

		selected.on('collect', async selection =>
		{
			selection.deferUpdate()
			final = array[selection.values]

			if(selection.values[0] === "2")	embed.setImage('https://cdn.discordapp.com/attachments/1242636042469642300/1381666818615410808/Chippy_board.png?ex=684858ff&is=6847077f&hm=6890eb460fd71f05b00f0379a5ab9691451b3b19c9f0f2c6e6ce9fd7633afd35&')
			else            				embed.setImage(null)

			sendEmbed()
		})

		selected.on('end', async collected =>
		{
			row.components = []

		    try     { await interaction.editReply({ embeds: [embed], components: [] }) }
		    catch   { dev.log("Failed to respond \n cmdID: 2, Error: 2", 2) }
		})

		async function sendEmbed()
		{
			embed
		    .setAuthor({ name: "Guide", iconURL: "https://images-ext-1.discordapp.net/external/Aoodd70VFvATVx7oV-a4RChQpLYg0-MaPwLDCKMhlDw/https/cdn.discordapp.com/avatars/1373621336982949992/56f8b12a7da35ca3dee0027db483faee?format=webp" })
		    .setDescription(final)

		    try     { await interaction.editReply({ embeds: [embed], components: [row] }) }
		    catch   { dev.log("Failed to respond \n cmdID: 2, Error: 1", 2) }
		}
	}
}
