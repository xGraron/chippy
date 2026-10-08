const dev = require('../handlers/dev.js')

const items =
[   //array of all items
    {"name":"Blank Round", "price": 99,     "id": "i1"},
    {"name":"Platinum Chip", "price": 99,   "id": "i2"},
    {"name":"Golden Carrot", "price": 99,  "id": "i3"},
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
