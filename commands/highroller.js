const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, MessageAttachment, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                             																							= require("random-js")
const path		= require("path")
const dh 		= require("../handlers/dataHandler.js")
const eh 		= require("../handlers/errorHandler.js")
const dev   	= require('../handlers/dev.js')

const random	= new Random()

module.exports =
{
	data: new SlashCommandBuilder()
	.setName("high")
	.setDescription("Games for the rich")
	.addSubcommand(subcommand => subcommand
		.setName("cheapo")
		.setDescription("Bet 10% of your money")
	)
	.addSubcommand(subcommand => subcommand
		.setName("allin")
		.setDescription("Go big or go home")
	)
	.setContexts(
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel
	),

	async execute(interaction, userStats)
	{
		await interaction.deferReply()

        if(userStats.chips < 50000)   return eh.error(interaction, "You need to have at least 50k, brokie")
		if(userStats.active_game)     return eh.error(interaction, "You are already playing a game!")

		const subcommand 	= interaction.options.getSubcommand();
		const UID			= interaction.user.id
		const games 		= [ "poker", "blackjack", "baccarat" ]
		const game 			= require(`../games/${games[random.integer(0, games.length - 1)]}.js`)

		let bet;

        if(subcommand === "allin")  bet = userStats.chips
        else                        bet = Math.floor(userStats.chips / 10)

		userStats.active_game 	= true
		userStats.chips 		= userStats.chips - bet

		game.main(interaction, bet, userStats, UID)
		await dh.userSave(interaction.user.id, userStats)
	}
}
