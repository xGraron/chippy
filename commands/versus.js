const { SlashCommandBuilder, EmbedBuilder, MessageAttachment, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")	
const path		= require("path")
const dh 		= require("../handlers/dataHandler.js")
const eh 		= require("../handlers/errorHandler.js")
const dev   	= require('../handlers/dev.js')

module.exports = 
{
	data: new SlashCommandBuilder()
	.setName("challenge")
	.setDescription("Challenge someone else!")
	.addSubcommand(subcommand => subcommand
		.setName("coinflip")
		.setDescription("50/50, who will win?")
		.addIntegerOption(option => option
			.setName("bet")
			.setDescription("Your bet")
			.setRequired(true)
		)
	),

	async execute(interaction, userStats)
	{
	    await interaction.deferReply()

		const bet 			= interaction.options.getInteger('bet')
		const subcommand 	= interaction.options.getSubcommand();
		const UID			= interaction.user.id
		const game 			= require(`../versus/${subcommand}.js`) 

		if(!userStats.active_game)
		{			
			if(bet > userStats.chips) 	{ return eh.error(interaction, "You don't have enough chips!") }

			const embed = new EmbedBuilder()
			.setTitle(`Them vs You`)
			.setDescription(`${interaction.user} challenges the chat! \n**Game:** ${subcommand} \n**Wager:** ${bet} Chips`)

		    const accept = new ButtonBuilder()
		    .setCustomId("b_accept")
		    .setLabel("Accept")
		    .setStyle(ButtonStyle.Secondary)

		    const row = new ActionRowBuilder().addComponents(accept)

			const initial = await interaction.editReply({ embeds: [embed], components: [row] })
			const pressed = await initial.createMessageComponentCollector({ time: 10_000 })

			pressed.on('collect', async button =>
			{
				const opponentStats = dh.userGet(button.user.id)
				if(button.user.id === UID)		return button.reply({ content: "You can't play against yourself!", ephemeral: true})
				if(opponentStats.active_game) 	return button.reply({ content: "You are already playing a game!", ephemeral: true })
				if(opponentStats.chips < bet)	return button.reply({ content: "You can not afford that", ephemeral: true })

				await button.deferUpdate()

				final(userStats, opponentStats, interaction, embed, bet, game)

				pressed.stop("joined")
			})

			pressed.on('end', async (collected, reason) =>
			{
				if(reason !== "joined")
				{
					embed.setDescription(`Nobody wanted to play with ${interaction.user}`)

					interaction.editReply({ embeds: [embed], components:[] })
				}
			})	
        }
		else
		{
			eh.error(interaction, "You are already playing a game!")
		}
	}
}

async function final(userStats, opponentStats, interaction, embed, bet, game)
{
	userStats.active_game 		= true
	opponentStats.active_game 	= true
	userStats.chips 			= userStats.chips - bet
	opponentStats.chips			= opponentStats.chips - bet 

	await dh.userSave(interaction.user.id, userStats)	
	await dh.userSave(opponentStats.userID, opponentStats)
	game.main(userStats, opponentStats, interaction, embed, bet)
}
