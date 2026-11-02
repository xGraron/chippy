const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, } = require("discord.js")
const xh        = require('../handlers/xpHandler.js')
const dev       = require('../handlers/dev.js')
const ah        = require('../handlers/assetHandler.js')
const jsonfile	= require("jsonfile")

const emojis = ah.badges()

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("referal")
    .setDescription("Redeem a referal code")
    .addIntegerOption(option => option
        .setName("code")
        .setDescription("Enter your referal code")
        .setRequired(true)
    )
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel
    ),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const code      = interaction.options.getInteger('code')
        const userdata  = jsonfile.readFileSync("database/userdata.json")

        if(!(code in userdata)) return eh.error("Code doesn't exist", interaction)

        await interaction.editReply({ embeds: [embed] })
    }
}
