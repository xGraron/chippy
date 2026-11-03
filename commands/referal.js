const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, } = require("discord.js")
const xh        = require('../handlers/xpHandler.js')
const dev       = require('../handlers/dev.js')
const ah        = require('../handlers/assetHandler.js')
const dh        = require('../handlers/dataHandler.js')
const jsonfile	= require("jsonfile")

const emojis = ah.badges()

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("referral")
    .setDescription("Redeem a referral code")
    .addStringOption(option => option
        .setName("code")
        .setDescription("Enter your referral code")
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

        const code   = interaction.options.getString('code')
        const codes = jsonfile.readFileSync("database/codes.json")

        if(!(code in codes))    return interaction.editReply("Referal code does not exist")
        if(userStats.referred)  return interaction.editReply("You've already redeemed a code")

        userStats.chips         += Number(codes[code])
        userStats["referred"]   = true

        interaction.editReply(`Successfully claimed ${codes[code]} Chips for code "${code}"`)

        dh.userSave(userStats)
    }
}
