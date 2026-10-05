const dev = require('../handlers/dev.js')

const items =
[   //array of all items
    {"name":"testitem1", "price": 10,   "id": "i1", "display":"TEMP"},
    {"name":"testitem2", "price": 5,    "id": "i2", "display":"TEMP"},
    {"name":"testitem3", "price": 125,  "id": "i3", "display":"TEMP"},
    {"name":"testitem4", "price": 10,   "id": "i4", "display":"TEMP"},
    {"name":"testitem5", "price": 30,   "id": "i5", "display":"TEMP"},
    {"name":"testitem6", "price": 15,   "id": "i6", "display":"TEMP"},
    {"name":"testitem7", "price": 40,   "id": "i7", "display":"TEMP"},
    {"name":"testitem8", "price": 50,   "id": "i8", "display":"TEMP"},
    {"name":"testitem9", "price": 215,  "id": "i9", "display":"TEMP"},
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
