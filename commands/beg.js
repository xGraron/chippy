const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, } = require("discord.js")
const { Random }                             = require("random-js")
const fs    = require('fs')
const path  = require('path')
const xh    = require('../handlers/xpHandler.js')
const eh    = require('../handlers/errorHandler.js')    
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("beg")
        .setDescription("Broke? Beg for money")
        .setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel
        ),
                    
    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        if((Date.now() - userStats.lastbeg) < 300000) return eh.error(interaction, "Give it a bit until you can beg again");

        const random    = new Random()
        const lucky     = random.integer(1, 10)

        let n               = random.integer(10, 100)
        if(lucky === 7) n   = n*2;
        
        userStats.chips     = userStats.chips + n
        userStats.lastbeg   = Date.now()

        const embed = new EmbedBuilder()
        .setTitle(`Brokey...`)
        .setDescription(`You begged a stranger for some money \n-# Gained **${n}** Chips`)

        await xh.leveling(userStats, 5)
        await dh.userSave(userStats)

        try     { await interaction.editReply({ embeds: [embed] }) }
        catch   { dev.log("Failed to respond \n cmdID: 3, Error: 1", 2) }
    }
}
