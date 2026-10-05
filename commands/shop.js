const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js")
const xh    = require('../handlers/xpHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

//TEMPORARY
const assets = ["PLACEHOLDER"]
const items =
[
    {"name":"testitem1", "price":10, "id": "i1"},
    {"name":"testitem2", "price": 5, "id": "i2"},
    {"name":"testitem3", "price": 15, "id": "i3"},
]
//TEMPORARY

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open the shop"),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const menu = new StringSelectMenuBuilder()
        .setCustomId('shop')
        .setPlaceholder('All the items')

        const embed = new EmbedBuilder()
        .setTitle(`Welcome in`)
        .setDescription(`Check out all the nice thing's we got`)

        items.forEach(item =>
        {
            menu.addOptions(
                new StringSelectMenuOptionBuilder()
                .setLabel(item.name)
                .setDescription(`Costs ${item.price} Chips`)
                .setValue(item.id)
            )
        })

        const row = new ActionRowBuilder().addComponents(menu)

        interaction.editReply({ embeds: [embed], components: [row] })
    }
}
