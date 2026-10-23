const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random }                                                     	= require('random-js')
const dh 	= require("../handlers/dataHandler.js")
const eh 	= require("../handlers/errorHandler.js")
const ch    = require('../handlers/cardHandler.js')
const xh	= require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah	= require('../handlers/assetHandler.js')

const colors	= ah.colors()
const random 	= new Random()
const statics	= [ah.static("coin0"), ah.static("coin1")]
const emojis    = ah.coins()
const gif		= ah.gif("coins")

async function main(userStats, opponentStats, interaction, embed, bet)
{
    embed
    .setTitle(`<@${opponentStats.userID}> turn`)
    .setDescription(null)

    dev.log("Success")
    dev.log(userStats.userID + " " + opponentStats.userID)

    interaction.editReply({ embeds: [embed], row: []})

    end(userStats, opponentStats, interaction, embed, bet)
}

async function end(userStats, opponentStats, interaction, embed)
{
    userStats.active_game       = false;
    opponentStats.active_game   = false;

    dh.userSave(userStats)
    dh.userSave(opponentStats)
}

module.exports =
{
    main,
}
