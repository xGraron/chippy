const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js")	
const dev   = require('../handlers/dev.js')

module.exports = 
{
	data: new SlashCommandBuilder()
	.setName("guide")
	.setDescription("See how things work"),

	async execute(interaction, userStats)
	{
		await interaction.deferReply()

		const button = new ButtonBuilder()
		.setLabel("Take the survey!")
		.setURL("https://forms.gle/PNerFHLpQb7ha9NE9")
		.setStyle(ButtonStyle.Link)

		const row = new ActionRowBuilder().addComponents(button)

		const embed = new EmbedBuilder()
		.setTitle(`${interaction.user.displayName}, hey there!`)
		.setDescription(`Chippy has reached EoL a while ago, but I am currently **planning to revive it!** \n
		However, for that to happen **I need your help.** \n`)
		.setFooter({ text: `Please take two minutes to fill out this survey!` })

		try     { await interaction.editReply({ embeds: [embed], components: [row] }) }
		catch   { dev.log("Failed to respond \n cmdID: 2, Error: 1", 2) }
	}
}
