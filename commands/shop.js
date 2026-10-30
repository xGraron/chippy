const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js")
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')
const ih    = require('../handlers/itemHandler.js')

const items     = ih.list("shop")
const emojis    = ah.items()

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open the shop")
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel
    ),

    async execute(interaction)
    {
        await interaction.deferReply()

        var cost        = {}
        var userStats   = {}

        const menu = new StringSelectMenuBuilder()
        .setCustomId('shop')
        .setPlaceholder('Click me to buy')

        const embed = new EmbedBuilder()
        .setTitle(`Welcome in`)
        .setDescription(`Check out all the nice thing's we got`)

        items.forEach(item =>
        {
            menu.addOptions(
                new StringSelectMenuOptionBuilder()
                .setLabel(`${item.name} - ${item.price} Chips`)
                .setDescription(item.description)
                .setValue(item.id)
                .setEmoji(emojis[item.id])
            )

            cost[item.id] = item.price
        })

        const row = new ActionRowBuilder().addComponents(menu)

        initial = await interaction.editReply({ embeds: [embed], components: [row] })

        const select = await new Promise(resolve =>
        {
            const collector = initial.createMessageComponentCollector({ time: 30_000 })

            collector.on("collect", async selection =>
            {
                userStats = dh.userGet(selection.user.id)

                if(cost[selection.values[0]] > userStats.chips) 
                {
                    selection.reply({ content: "You're too poor", ephemeral: true })
                    return interaction.editReply({ components:  [row] })
                }

                userStats.chips -= cost[selection.values[0]]
                userStats.inventory.push(selection.values[0])

                dh.userSave(userStats)

                selection.deferUpdate()
                interaction.editReply({ components:  [row] })
            })

            collector.on("end", (collected, reason) =>
            {
                embed
                .setTitle("Shop's closed")
                .setDescription("Thank you and come again")

                interaction.editReply({ embeds: [embed], components: [] })
                resolve(null)
            })
        })
    }
}
