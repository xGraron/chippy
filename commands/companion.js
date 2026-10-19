const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, MessageFlags } = require("discord.js")
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const bodies    = []
const b_total   = 1
const dents     = []
const d_total   = 1
const eyes      = []
const e_total   = 5

for(let i = 0; i < b_total; i++)
{
    bodies.push(ah.static(`body_${i}`))
}
for(let i = 0; i < d_total; i++)
{
    dents.push(ah.static(`dents_${i}`))
}
for(let i = 0; i < e_total; i++)
{
    eyes.push(ah.static(`eyes_${i}`))
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

        var current = "body"

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

        const container = new ContainerBuilder()
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent('Editing your companion \nName: *test*'))
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(bodies[0]))
        )
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Currently editing: **${current}**`))
            .setButtonAccessory(save)
        )

        await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2, ephemeral: true })
    }
}

async function view(interaction, userStats)
{
    interaction.editReply({ content: "Cheggem"})
}
