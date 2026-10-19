const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, MessageFlags } = require("discord.js")
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const b_total   = 1
const d_total   = 1
const e_total   = 5

choices = 
{
    "bodies": [],
    "dents": [],
    "eyes": []
}

for(let i = 0; i < b_total; i++)
{
    choices["bodies"].push(ah.static(`body_${i}`))
}
for(let i = 0; i < d_total; i++)
{
    choices["dents"].push(ah.static(`dents_${i}`))
}
for(let i = 0; i < e_total; i++)
{
    choices["eyes"].push(ah.static(`eyes_${i}`))
}

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

        if(interaction.options.getSubcommand() === "view") return view(interaction, userStats)

        var current = "eyes"
        var tracker = 0

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
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(choices[current][tracker]))
        )
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Currently selection: **${current}**`))
            .setButtonAccessory(save)
        )

        const initial = await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2, ephemeral: true })

            const press = await new Promise(resolve =>
    {
        const collector = initial.createMessageComponentCollector({ time: 60_000 })

        let resolved = false

        collector.on("collect", async button =>
        {
            if(button.user.id !== interaction.user.id)  return button.reply({ content: "This isn't your companion!", ephemeral: true })

            if(resolved) return

            if(button.customId === "b_next") tracker++
            if(button.customId === "b_prev") tracker--

            container = new ContainerBuilder()
            .addSectionComponents((section) => section
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent('Editing your companion \nName: *test*'))
                .setThumbnailAccessory((thumbnail) => thumbnail.setURL(choices[current][tracker]))
            )
            .addSectionComponents((section) => section
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Currently selection: **${current}**`))
                .setButtonAccessory(save)
            )

            button.deferUpdate()
            interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2, ephemeral: true })
        })

        collector.on("end", (collected, reason) =>
        {
            if(resolved) return

            resolved = true
            resolve(null)
        })
    })
    }
}

async function view(interaction, userStats)
{
    interaction.editReply({ content: "Cheggem"})
}
