const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, MessageFlags, AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage }                                                                           = require('@napi-rs/canvas')
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const available = [ "body", "accents", "eyes", "hats"]

module.exports =
{
    data: new SlashCommandBuilder()
    .setName("companion")
    .setDescription("See & customize your companion")
    .addSubcommand(subcommand => subcommand
        .setName("view")
        .setDescription("View your companion")
     )
    .addSubcommand(subcommand => subcommand
        .setName("customize")
        .setDescription("Customize your companion")

    ),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const parts     = []

        if(!userStats.companion)    userStats.companion = [0, 0, 0]
        if(!userStats.unlocked)     userStats.unlocked = [[0, 1], [0, 1], [0, 1, ]]

        if(interaction.options.getSubcommand() === "view") return view(interaction, userStats)

        for(let i = 0; i < userStats.unlocked.length; i++)
        {
            parts.push([])

            userStats.unlocked[i].forEach(part => parts[i].push(ah.static(`comp/${available[i]}_${part}`)) )
        }

        var current = 0
        var tracker = 0
        var image   = await composite(parts, userStats)


        const save = new ButtonBuilder()
        .setCustomId("b_save")
        .setEmoji('💾')
        .setStyle(ButtonStyle.Secondary)

        const next = new ButtonBuilder()
        .setCustomId("b_next")
        .setLabel("--->")
        .setStyle(ButtonStyle.Success)

        const prev = new ButtonBuilder()
        .setCustomId("b_prev")
        .setLabel("<---")
        .setStyle(ButtonStyle.Success)

        const change = new ButtonBuilder()
        .setCustomId("b_change")
        .setLabel("Change type")
        .setStyle(ButtonStyle.Secondary)

        const row 	= new ActionRowBuilder().addComponents(prev, change, next)

        let container = new ContainerBuilder()
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent('Editing your companion \nName: *test*'))
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://result.png"))
        )
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Currently selection: **${current}**`))
            .setButtonAccessory(save)
        )

        const initial = await interaction.editReply({ components: [container, row], files: [image], flags: MessageFlags.IsComponentsV2, ephemeral: true })

            const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 60_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== interaction.user.id)  return button.reply({ content: "This isn't your companion!", ephemeral: true })

            if(resolved) return

            dev.log(current)
            dev.log(userStats.companion)
            dev.log(parts[current].length)

            if(button.customId === "b_next")                                userStats.companion[current]++
            if(button.customId === "b_prev")                                userStats.companion[current]--

            if(userStats.companion[current] < 0)                            userStats.companion[current] = parts[current].length - 1
            if(userStats.companion[current] > parts[current].length - 1)    userStats.companion[current] = 0

            if(button.customId === "b_change") current++
            if(button.customId === "b_save") collector.stop("save")

            image = await composite(parts, userStats)

            container = new ContainerBuilder()
            .addSectionComponents((section) => section
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent('Editing your companion \nName: *test*'))
                .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://result.png"))
            )
            .addSectionComponents((section) => section
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Currently selection: **${current}**`))
                .setButtonAccessory(save)
            )

            button.deferUpdate()
            interaction.editReply({ components: [container, row], files: [image], flags: MessageFlags.IsComponentsV2, ephemeral: true })
        })

        collector.on("end", (collected, reason) =>
        {
            if(resolved) return

            dev.log(reason)

            resolved = true
            resolve(null)
        })
    })
    }
}

async function composite(parts, userStats)
{
    const canvas    = createCanvas(512, 512)
    const context   = canvas.getContext('2d')

    for(let i = 0; i < userStats.companion.length; i++)
    {
        const temp = await loadImage(parts[i][userStats.companion[i]])

        context.drawImage(temp, 0, 0)
    }

    const img = new AttachmentBuilder(
        canvas.toBuffer('image/png'),
        { name: 'result.png' }
    );

    return img
}

async function view(interaction, userStats)
{
    interaction.editReply({ content: "Cheggem"})
}
