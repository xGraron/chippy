const { SlashCommandBuilder, EmbedBuilder, MessageAttachment, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")	
const path		= require("path")
const dh 		= require("../handlers/dataHandler.js")
const eh 		= require("../handlers/errorHandler.js")
const dev   	= require('../handlers/dev.js')

var roulette_choices =  
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

const horse_choices =
[
	{ name: "⬛ Spades", value: "black"},
    { name: "🟥 Jackie", value: "red"}, 
    { name: "🟨 Giggle", value: "yellow"},
    { name: "🟪 V", value: "purple"},
    { name: "🟧 Juan", value: "orange"},
    { name: "🟩 Hearts", value: "green"},
    { name: "🟫 Dutch", value: "brown"}
]

module.exports = 
{
	data: new SlashCommandBuilder()
	.setName("play")
	.setDescription("Play a game")
	.addSubcommand(subcommand => subcommand 
		.setName("highorlow")
		.setDescription("Which one will it be?")
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet")
			.setRequired(false)
		)
	)
	.addSubcommand(subcommand => subcommand
		.setName("seventeen")
		.setDescription("Blackjack, but different.")
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet")
			.setRequired(false)
		)
	)
	.addSubcommand(subcommand => subcommand
		.setName("blackjack")
		.setDescription("A casino classic!")
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet")
			.setRequired(false)
		)
	)
	.addSubcommand(subcommand => subcommand
		.setName("roulette")
		.setDescription("Where will the ball land?")
		.addStringOption(option => option
			.setName("fields")
			.setDescription("Which field(s) are you betting on?")
			.setRequired(true)
			.addChoices(...roulette_choices)
		)
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet")
			.setRequired(false)
		)
	)
	.addSubcommand(subcommand => subcommand
		.setName("horse")
		.setDescription("Which horse will win?")
		.addStringOption(option => option
			.setName("horse")
			.setDescription("Which horse are you betting on?")
			.setRequired(true)
			.addChoices(...horse_choices)
		)
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet")
			.setRequired(false)
		)
	)
	.addSubcommand(subcommand => subcommand
		.setName("racer")
		.setDescription("Don't crash!")
	)
	.addSubcommand(subcommand => subcommand
		.setName("slots")
		.setDescription("Pretty lights!")
	)	
	.addSubcommand(subcommand => subcommand
		.setName("poker")
		.setDescription("Casino Hold'em.")
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet (you will need 3x your bet!)")
			.setRequired(false)
		)
	)
	.addSubcommand(subcommand => subcommand 
		.setName("cardrush")
		.setDescription("Can't stop now!")
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your initial bet")
			.setRequired(false)
		)
	),

	async execute(interaction, userStats)
	{
		await interaction.deferReply()

		let 		bet = interaction.options.getInteger('bet') || 50
		if(bet < 0)	bet = 50 		

		const chosen		= interaction.options.getString("fields") || interaction.options.getString("horse") || "none"
		const subcommand 	= interaction.options.getSubcommand();
		const UID			= interaction.user.id
		const game 			= require(`../games/${subcommand}.js`) 

		if(!userStats.active_game)
		{			
			if(bet > userStats.chips) 	{ return eh.error(interaction, "You don't have enough chips!") }
			if(bet > 1000)				{ return eh.error(interaction, "You can only bet up to 1.000 chips!") }

			userStats.active_game 	= true
			userStats.chips 		= userStats.chips - bet

			game.main(interaction, bet, userStats, UID, chosen)
        	await dh.userSave(interaction.user.id, userStats)		
        }
		else
		{
			eh.error(interaction, "You are already playing a game!")
		}
	}
}
