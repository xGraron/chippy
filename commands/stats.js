const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")	
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')

//live badges
const badges =
{
    11: "<:11:1391490739262718183>",
    12: "<:12:1391490745550245939>",
    13: "<:13:1391490758573559978>",
    14: "<:14:1391788730494484570>",
    15: "<:15:1391493405825175652>",
    21: "<:21:1400541727214932070>",
    22: "<:22:1400541737604091974>",
    50: "<:50:1391788739755245659>",
    69: "<:69:1391788746604675184>",
    90: "<:90:1402639786967044196>",
    101: "<:101:1395372911682129920>",
    102: "<:102:1391414174344679435>",
    103: "<:103:1391414182137565257>",
    201: "<:201:1391414190153011330>",
    202: "<:202:1391414199997169805>",
    203: "<:203:1391414219764924547>",
    204: "<:204:1391793652178882692>",
    401: "<:401:1395373191811174441>",
    402: "<:402:1395373202091282443>",
    403: "<:403:1395373209641291796>",
    404: "<:404:1391788774672961546>",
    501: "<:501:1391483450153767162>",
    502: "<:502:1391793662287155302>",
    503: "<:503:1391793672982499378>",
    701: "<:701:1391487659465248849>",
    801: "<:801:1397206591375147182>",
    802: "<:802:1397206600631980064>",
    803: "<:803:1397206608756346932>",
    804: "<:804:1397206616344105021>",
    805: "<:805:1397206623793057873>",
    806: "<:806:1397206629640048691>",
    807: "<:807:1397206636082364426>",
    808: "<:808:1397206643196035217>",
    809: "<:809:1397206649772445736>",
    810: "<:810:1397206657611858070>",
    901: "<:901:1400904497781538890>",
    902: "<:902:1400904505985335427>",
    903: "<:903:1400904513208062012>",
}

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
            badge_str += `${badges[badge]}`
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
