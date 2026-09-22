const { SlashCommandBuilder, EmbedBuilder, } = require("discord.js")	
const dev   = require('../handlers/dev.js')
const ah    = require('../handlers/assetHandler.js')

const emojis = ah.badges()
const titles =
{
    11: { name: "Mr. Moneybags",                    description: "Have over 1.000 Chips" },
    12: { name: "Scrooge McDuck",                   description: "Have over 10.000 Chips" },
    13: { name: "Big Bibi",                         description: "Have over 100.000 Chips" },
    15: { name: "Menace To Society",               description: "Use /crime & succeed" },
    14: { name: "Lose It All",                     description: "Lose all your money in a single bet" },
    16: { name: "I Dont Want To Be Here Anymore",   description: "Reset your progress using /reset"},
    21: { name: "Amateur Gambler",                 description: "Reach level 10"},
    22: { name: "Ranked Gambler",                  description: "Reach level 100"},
    50: { name: "Five Hundred Cigarettes",         description: "Buy 500 Cigarettes at once" },
    69: { name: "Six Seven",                    description: "Have exactly 67 Chips" },
    69: { name: "Funny Number",                    description: "Have exactly 69.420 Chips" },
    90: { name: "Final Solution",                  description: "Try 'Russian Roulette' and lose"},
    101: { name: "I'm A Good Guesser 🥉",       description: "Play 5 games of 'High Or Low'" },
    102: { name: "I'm A Good Guesser 🥈",       description: "Play 25 games of 'High Or Low'" },
    103: { name: "I'm A Good Guesser 🥇",       description: "Play 100 games of 'High Or Low'" },
    201: { name: "My Head Is Spinning 🥉",      description: "Play 5 games of 'Roulette'" },
    202: { name: "My Head Is Spinning 🥈",      description: "Play 25 games of 'Roulette'" },
    203: { name: "My Head Is Spinning 🥇",      description: "Play 100 games of 'Roulette'" },
    204: { name: "Go Big Or Go Home",               description: "Put in the maximum bet & lose in 'Roulette'" },
    401: { name: "Basic Strategy, Trust Me 🥉", description: "Play 5 games of 'Blackjack'" },
    402: { name: "Basic Strategy, Trust Me 🥈", description: "Play 25 games of 'Blackjack'" },
    403: { name: "Basic Strategy, Trust Me 🥇", description: "Play 100 games of 'Blackjack'" },
    404: { name: "I Have No Clue",                 description: "In 'Blackjack', hit when having 17 points" },
    501: { name: "Steroids",                       description: "Win when betting on horse" },
    502: { name: "Glue Factory",                   description: "Bet over 1.000 Chips on a horse & lose" },
    503: { name: "My Brain Is Dead I Fear",        description: "Win when betting on horse 'Giggle' (yellow)" },
    701: { name: "Retirement Defund",            description: "Play 10 games of 'Slots'" },
    802: { name: "Pair",                           description: "In 'Poker', win with 'Pair'"},
    803: { name: "Two Pair",                       description: "In 'Poker', win with 'Two Pair'"},
    804: { name: "Three Of A Kind",                description: "In 'Poker', win with 'Three Of A Kind'"},
    805: { name: "Straight",                       description: "In 'Poker', win with 'Straight'"},
    806: { name: "Flush",                          description: "In 'Poker', win with 'Flush'"},
    807: { name: "Doctor House",                   description: "In 'Poker', win with 'Full House'"},
    808: { name: "Lucky Man",                      description: "In 'Poker', win with 'Four Of A Kind'"},
    809: { name: "Twitter",                        description: "In 'Poker', win with 'Straigh Flush'"},
    810: { name: "Majesty",                        description: "In 'Poker', win with 'Royal Flush'"},
    901: { name: "In a hurry! 🥉",               description: "Play 5 games of 'Card Rush'" },
    902: { name: "In a hurry! 🥈",               description: "Play 25 games of 'Card Rush'" },
    903: { name: "In a hurry! 🥇",               description: "Play 100 games of 'Card Rush'" },
}

const publics = [ 11, 12, 13, 21, 22, 90, 101, 102, 103, 201, 202, 203, 401, 402, 403, 501, 701, 901, 902, 903 ]
const secrets = [ 14, 15, 16, 50, 67, 69, 204, 404, 405, 502, 503, 802, 803, 804, 805, 806, 807, 808, 809, 810 ]

module.exports = 
{
	data: new SlashCommandBuilder()
	.setName("badges")
	.setDescription("Check out (almost) all the badges")       
    .addStringOption(option => option
            .setName("type")
            .setDescription("What type of badges do you want to see?")
            .setRequired(true)
            .addChoices(
                { name: "Public Badges", value: "public"},
                { name: "Secret Badges", value: "secret"})
        ),

	async execute(interaction, userStats)
	{
		await interaction.deferReply()

        const earned = []
        const chosen = interaction.options.getString("type")

        let unlocked        = 0
        let public_str      = ""
        let private_str     = ""
        let description_str = "Badges with a ❓ are Badges you haven't earned yet. \n-# There are also a few *secret* badges that only show up in /badges secrets once earned\n\n"

        for(const badge of userStats.achievements)
        {
            earned.push(Number(badge))
        }
        
        for(const badge of publics)
        {
            if(earned.includes(badge))
            {
                public_str += `${emojis[badge]} ${titles[badge].name} \n-# ${titles[badge].description} \n`
            }
            else
            {
                public_str += `❓ ${titles[badge].name} \n-# ${titles[badge].description} \n`
            }
        }

        for(const badge of secrets)
        {
            if(earned.includes(badge))
            {
                unlocked++
                private_str += `${emojis[badge]} ${titles[badge].name} \n-# ${titles[badge].description} \n`
            }
        }

        const totals = `\nUnlocked: ${unlocked}/${secrets.length}`

        if(chosen === "public")    description_str += public_str
        else                        description_str = private_str + totals

        const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s badges:`)
        .setDescription(description_str)

        try     { await interaction.editReply({ embeds: [embed] }) }
        catch   { dev.log("Failed to respond \n cmdID: 8, Error: 1", 2) }
    }
}
