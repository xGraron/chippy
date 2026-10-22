const dev = require('../handlers/dev.js')

const items =
[   //array of all items
    {"name":"Blank Round", "price": 500, "id": "i1", "description": "Let's you play Russian Roulette without the risk of dying."},
    {"name":"Platinum Chip", "price": 99,   "id": "i2", "description": "!WIP! Doubles your bet on Roulette for free "},
    {"name":"Golden Carrot", "price": 99,  "id": "i3", "description": "!WIP! Raises the chance of your horse to win the race"},
    {"name":"Egge", "price": 10000,         "id": "i4", "description": "I wonder what's inside.. run /companion egge"}
]


function list(type)
{
    if(type === "shop") return items
    else
    {
        let list = {}

        items.forEach(item =>
        {
            list[item.id] = item.name
        })

        return list
    }
}

function ability()
{

}

module.exports =
{
    list, ability
}
