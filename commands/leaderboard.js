require("dotenv").config()

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, } = require("discord.js")
const { fetch }                             = require("undici")
const eh    = require("../handlers/errorHandler.js")
const dh    = require("../handlers/dataHandler.js")
const dev   = require("../handlers/dev.js")

const { DISCORD_TOKEN: token } = process.env

const titles = 
{
    "chips": "Chips",
    "xp": "Experience"
}

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the global leaderboard")
    .addStringOption(option => option
        .setName("type")
        .setDescription("How would you like the leaderboard to be sorted")
        .setRequired(true)
        .addChoices(
            { name: "Chips", value: "chips" },
            { name: "XP", value: "xp" }   
        )
    )
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel
    ),

    async execute(interaction)
    {
        await interaction.deferReply()

        var chosen      = interaction.options.getString("type")
        var user_arr    = []
        var alt_str     = ""
        var user_str    = ""
        var val_str     = ""

        const userdata = dh.sort(chosen)

        userdata.forEach(user =>
        {
            user_arr.push(user[1].userID)
            val_str     += `${user[1][chosen]} \n`
        })

        user_str = await api(user_arr, user_str)
        alt_str = await alternative(user_arr, alt_str)

        const embed = new EmbedBuilder()
        .setTitle("Leaderboard")
        .addFields(
            { name: "User", value: user_str || alt_str, inline: true },
            { name: titles[chosen], value: val_str, inline: true },
        )

        try     { await interaction.editReply({ embeds: [embed] }) }
        catch   { dev.log("Failed to respond \n cmdID: 7, Error: 1", 2) }  
    }
}

async function api(user_arr, user_str)
{
    for(const id of user_arr)
    {
        const res = await fetch(`https://discord.com/api/v10/users/${id}`, 
        {
            headers: 
            {
              Authorization: `Bot ${token}`
            }
        })

        if (!res.ok) user_str += `*unavailable* \n`;
        else
        {
            const data = await res.json()

            user_str += `${data.username} \n`
        }
    }

    return user_str
}

async function alternative(user_arr, alt_str)
{
    for(const id of user_arr)
    {
        alt_str += `<@${id}> \n`
    }

    return alt_str
}
