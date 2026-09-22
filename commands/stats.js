const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")	
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const emojis = ah.badges()

module.exports = 
{
	data: new SlashCommandBuilder()
	.setName("stats")
	.setDescription("Check your stats"),

	async execute(interaction, userStats)
	{
		await interaction.deferReply()
        await xh.leveling(userStats, 0)

        const { chips, level, xp, custom } 	= userStats
        const xpreq                         = 20 * (level * level) 
        const one_per                       = xpreq / 10
        const progress                      = Math.floor(xp / one_per)
        const thumb							= custom.thumbnail || interaction.user.displayAvatarURL({ dynamic: true }) 

        let badge_str   = ""
        let bar         = ""
        let remaining = 10

        for(const badge of userStats.achievements)
        {
            badge_str += `${emojis[badge]}`
        }

        for(i = 0; i < progress; i++)
        {
            remaining--
            bar += "🟩"
        }
        for(i = 0; i < remaining; i++)
        {
            bar += "⬛"
        }

        const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s stats:`)
        .setThumbnail(thumb)
        .setDescription(`**Chips:** ${chips} \n**Level:** ${level} \n-# Next level: ${bar}`)
        .addFields(
            { name: "Badges", value: badge_str, inline: true },
        )

        if(userStats.dead) embed.setFooter({ text: `Died` }).setTimestamp(new Date(userStats.lastrussian));

        try     { await interaction.editReply({ embeds: [embed] }) }
        catch   { dev.log("Failed to respond \n cmdID: 1, Error: 1", 2) }
    }
}
