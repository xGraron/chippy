const dev = require('../handlers/dev.js')

const items =
[   //array of all items
    {"name":"testitem1", "price": 10,   "id": "i1"},
    {"name":"testitem2", "price": 5,    "id": "i2"},
    {"name":"testitem3", "price": 125,  "id": "i3"},
    {"name":"testitem4", "price": 10,   "id": "i4"},
    {"name":"testitem5", "price": 30,   "id": "i5"},
    {"name":"testitem6", "price": 15,   "id": "i6"},
    {"name":"testitem7", "price": 40,   "id": "i7"},
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
