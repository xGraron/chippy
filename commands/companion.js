const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, MessageFlags, AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage }   = require('@napi-rs/canvas')
const { Random }                    = require('random-js')                                                                            
const dh    = require('../handlers/dataHandler.js')
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const available = [ "body", "accents", "eyes", "hats"]
const amounts   = [ 3, 5, 8, 10 ]
const random    = new Random()          

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

    )
    .addSubcommand(subcommand => subcommand
        .setName("name")
        .setDescription("(Rename your companion")
        .addStringOption((option) => option
            .setName('name')
            .setDescription('What do you want your companion to be called')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => subcommand
        .setName("egge")
        .setDescription("Get new accessoires")
    ),

    async execute(interaction, userStats)
    {
        await interaction.deferReply()

        const parts     = []

        if(!userStats.companion)    
        {
            userStats["companion"] =
            {
                build:      [0, 0, 0, 0],
                unlocked:   [[0], [0], [0], [0]],
                name:       "Run /companion name"
            }

            dev.log("no companion")
        }

        for(let i = 0; i < userStats.companion.unlocked.length; i++)
        {
            parts.push([])

            userStats.companion.unlocked[i].forEach(part => parts[i].push(ah.static(`comp/${available[i]}_${part}`)) )
        }

        if(interaction.options.getSubcommand() === "view")  return view(interaction, userStats, parts)
        if(interaction.options.getSubcommand() === "name")  return name(interaction, userStats, parts)
        if(interaction.options.getSubcommand() === "egge")  return egg(interaction, userStats)

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
        .setLabel("Change selection")
        .setStyle(ButtonStyle.Secondary)

        const row 	= new ActionRowBuilder().addComponents(prev, change, next)

        let container = new ContainerBuilder()
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent('Editing your companion \nName: *${userStats.companion.name}*'))
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://result.png"))
        )
        .addSectionComponents((section) => section
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Currently selection: **${available[current]}**`))
            .setButtonAccessory(save)
        )

        const initial = await interaction.editReply({ components: [container, row], files: [image], flags: MessageFlags.IsComponentsV2 })

        const press = await new Promise(resolve =>
        {
            const collector = initial.createMessageComponentCollector({ time: 60_000 })

            let resolved = false

            collector.on("collect", async button =>
            {
                if(button.user.id !== interaction.user.id)  return button.reply({ content: "This isn't your companion!", ephemeral: true })

                if(resolved) return

                button.deferUpdate()                    

                if(button.customId === "b_next")                                userStats.companion.build[current]++
                if(button.customId === "b_prev")                                userStats.companion.build[current]--

                if(userStats.companion.build[current] < 0)                            userStats.companion.build[current] = parts[current].length - 1
                if(userStats.companion.build[current] > parts[current].length - 1)    userStats.companion.build[current] = 0

                if(button.customId === "b_change")                  current++
                if(current === userStats.companion.build.length)    current = 0
                if(button.customId === "b_save")                    return collector.stop("save")

                image = await composite(parts, userStats)

                container = new ContainerBuilder()
                .addSectionComponents((section) => section
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Your companion \nName: *${userStats.companion.name}*`))
                    .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://result.png"))
                )
                .addSectionComponents((section) => section
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Current selection: **${available[current]}**`))
                    .setButtonAccessory(save)
                )

                interaction.editReply({ components: [container, row], files: [image], flags: MessageFlags.IsComponentsV2 })
            })

            collector.on("end", (collected, reason) =>
            {
                if(resolved) return

                if(reason === "save") dh.userSave(interaction.user.id, userStats)

                save.setDisabled(true)
                prev.setDisabled(true)
                next.setDisabled(true)
                change.setDisabled(true)

                container = new ContainerBuilder()
                .addSectionComponents((section) => section
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Your companion \nName: *${userStats.companion.name}*`))
                    .setThumbnailAccessory((thumbnail) => thumbnail.setURL("attachment://result.png"))
                )
                .addSectionComponents((section) => section
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`Saved successfully.`))
                    .setButtonAccessory(save)
                )

                interaction.editReply({ components: [container, row], files: [image], flags: MessageFlags.IsComponentsV2 })

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

    for(let i = 0; i < userStats.companion.build.length; i++)
    {
        const temp = await loadImage(parts[i][userStats.companion.build[i]])

        context.drawImage(temp, 0, 0)
    }

    const img = new AttachmentBuilder(
        canvas.toBuffer('image/png'),
        { name: 'result.png' }
    );

    return img
}

async function view(interaction, userStats, parts)
{
    image = await composite(parts, userStats)

    const embed = new EmbedBuilder()
    .setTitle(userStats.companion.name)
    .setDescription("Temp")
    .setThumbnail("attachment://result.png")

    interaction.editReply({ embeds:[embed], files: [image] })
}

async function name(interaction, userStats, parts)
{
    image = await composite(parts, userStats)

    const name = interaction.options.getString('name')

    const embed = new EmbedBuilder()
    .setTitle(name)
    .setDescription("Successfully renamed your companion")
    .setThumbnail("attachment://result.png")

    userStats.companion.name = name

    dh.userSave(interaction.user.id, userStats)

    interaction.editReply({ embeds:[embed], files: [image] })
}

async function egg(interaction, userStats, parts)
{
    //if(!userStats.companion.egg > 0) return interaction.editReply({ content: "You don't have an egge to open!", ephemeral: true})

    var rew;
    var has;

    const n = random.integer(0, 9)
    image = await ah.gif(`eggs_${n}`)

    const embed = new EmbedBuilder()
    .setTitle("Crackin' an egge")
    .setImage(image)

    interaction.editReply({ embeds:[embed] })

    const type  = random.integer(0, available.length)

    rew = unlock(0)

    function unlock(rew)
    {
        return rew = random.integer(0, amounts[type] - 1)
    }

    has = userStats.companion.unlocked[type].includes(rew)


    while(has) 
    {
        rew = unlock(0)
        has = userStats.companion.unlocked[type].includes(rew)
    }

    userStats.companion.unlocked[type].push(rew)
}
