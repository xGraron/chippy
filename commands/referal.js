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

        if(!(code in userdata)) return interaction.editReply("Referal code does not exist")
        if(userStats.referred)  return interaction.editReply("You've already redeemed a code")

        let referStats = await dh.userGet(code)
        referStats.chips        += 2500
        userStats.chips         += 2500
        userStats["referred"]   = true

        interaction.editReply(`Successfully claimed 2500 Chips for you and <@${code}`)

        dh.userSave(referStats)
        dh.userSave(userStats.chips)

        await interaction.editReply({ embeds: [embed] })
    }
}
