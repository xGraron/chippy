const { EmbedBuilder }  = require("discord.js")
const { Random }        = require("random-js")
const jsonfile          = require("jsonfile")
const fs                = require("fs")
const dev               = require('../handlers/dev.js')
const ah                = require('../handlers/assetHandler.js')

const random            = new Random()
const deck_templates    =  
{
    "standard": [ "Aceh", "Aces", "Aced", "Acec", "2h", "2s", "2d", "2c", "3h", "3s", "3d", "3c", "4h", "4s", "4d", "4c", "5h", "5s", "5d", "5c", "6h", "6s", "6d", "6c", "7h", "7s", "7d", "7c", "8h", "8s", "8d", "8c", "9h", "9s", "9d", "9c", "10h", "10s", "10d", "10c", "Jackh", "Jacks", "Jackd", "Jackc", "Queenh", "Queens", "Queend", "Queenc", "Kingh", "Kings", "Kingd", "Kingc" ],
    "short"   : [ "Aceh", "Aces", "Aced", "Acec", "7h", "7s", "7d", "7c", "8h", "8s", "8d", "8c", "9h", "9s", "9d", "9c", "10h", "10s", "10d", "10c", "Jackh", "Jacks", "Jackd", "Jackc", "Queenh", "Queens", "Queend", "Queenc", "Kingh", "Kings", "Kingd", "Kingc" ],
}

const cards =
{
    "Aceh": "Ace",
    "Aces": "Ace",
    "Aced": "Ace",
    "Acec": "Ace",
    "2h": 2,
    "2s": 2,
    "2d": 2,
    "2c": 2,
    "3h": 3,
    "3s": 3,
    "3d": 3,
    "3c": 3,
    "4h": 4,
    "4s": 4,
    "4d": 4,
    "4c": 4,
    "5h": 5,
    "5s": 5,
    "5d": 5,
    "5c": 5,
    "6h": 6,
    "6s": 6,
    "6d": 6,
    "6c": 6,
    "7h": 7,
    "7s": 7,
    "7d": 7,
    "7c": 7,
    "8h": 8,
    "8s": 8,
    "8d": 8,
    "8c": 8,
    "9h": 9,
    "9s": 9,
    "9d": 9,
    "9c": 9,
    "10h": 10,
    "10s": 10,
    "10d": 10,
    "10c": 10,
    "Jackh": "Jack",
    "Jacks": "Jack",
    "Jackd": "Jack",
    "Jackc": "Jack",
    "Queenh": "Queen",
    "Queens": "Queen",
    "Queend": "Queen",
    "Queenc": "Queen",
    "Kingh": "King",
    "Kings": "King",
    "Kingd": "King",
    "Kingc": "King"
}

const emojis            = ah.cards()

//create a new deck of cards 
async function create(UID, size, template)
{
    if(fs.existsSync(`database/deck_${UID}`)) return{ success: false, reason: "Deck already exists" }

    try
    {
        size        = size || 1
        template    = deck_templates[template] || deck_templates["standard"]

        const deck = Array(size).fill(template).flat()

        jsonfile.writeFileSync(`database/deck_${UID}`, deck)

        return{ success: true }
    }
    catch(err)
    {
        dev.log(err, 2)
        return{ success: false, reason: "Failed to create new deck" }
    }
}

//draw from an existing deck of cards
async function draw(ID) 
{
    try 
    { 
        const deck  = jsonfile.readFileSync(`database/deck_${ID}`)
        if (deck.length < 1) return{ success: false, reason: "No more cards remaining in deck" }

        const n         = random.integer(0, deck.length - 1)
        const emoji     = `<:${deck[n]}:${emojis[deck[n]]}>`
        const card      = cards[deck[n]]
        const suited    = deck[n]

        deck.splice(n, 1)
        jsonfile.writeFileSync(`database/deck_${ID}`, deck)

        return{ success: true, card: card, remaining: deck.length, emoji: emoji, suited: suited }
    }
    catch   
    { 
        return{ success: false, reason: "Error drawing card from deck" }
    }
}

//burn card(s) from an existing deck
async function burn(ID, amount)
{
    try 
    { 
        amount = amount || 1
        for (let i = 0; i < amount; i++)
        {
            const deck  = jsonfile.readFileSync(`database/deck_${ID}`)
            if (deck.length < 1) return{ success: false, reason: "No more cards remaining in deck" }

            const n     = random.integer(0, deck.length - 1)

            deck.splice(n, 1)
            jsonfile.writeFileSync(`database/deck_${ID}`, deck)
        } 
        return{ success: true}
    }
    catch   
    { 
        return{ success: false, reason: "Error burning card from deck" }
    }
}

//delete a deck 
async function remove(ID)
{
    try { jsonfile.readFileSync(`database/deck_${ID}`) }
    catch   
    { 
        return{ success: false, reason: "Deck not found" }
    }


    await fs.unlink(`database/deck_${ID}`, (err)=> 
    {
        if(err)
        {
            dev.log(err, 2)
            return{ success: false, reason: "Unable to delete deck, error has been logged."}
        }
    })

    return{ success: true }
}


module.exports =
{
    create, draw, burn, remove
}
