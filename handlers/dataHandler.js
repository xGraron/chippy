const jsonfile	= require("jsonfile")
const fs		= require("fs")

var userdata 	= {}
if(fs.existsSync("database/userdata.json")) userdata = jsonfile.readFileSync("database/userdata.json")

function userGet(ID)
{
	if(!(ID in userdata))
	{
		userdata[ID] =
		{
			userID: ID,
			registered: Date.now(),
			xp: 0,
			level: 1,
			chips: 2500,
			active_game: false,
			lastbeg: 0,
			inventory: {},
			games: {},
			achievements: [],
			custom: {},
		}

		jsonfile.writeFileSync("database/userdata.json", userdata)
		return userdata[ID]
	}
	else
	{
		return userdata[ID]
	}
}

function sort(parameter)
{
	if(fs.existsSync("database/userdata.json")) userdata = jsonfile.readFileSync("database/userdata.json")
		
	var sorted = Object.entries(userdata).sort(([, a], [, b]) => b[parameter] - a[parameter])

	if(sorted.length > 10) sorted = sorted.slice(0, 10)

	return sorted;
}

function userSave(ID, saveStats)
{
	userdata[ID] = saveStats

	jsonfile.writeFileSync("database/userdata.json", userdata)

	return{ success: true }
}

function devGet(ID)
{
	if(userdata[ID] === undefined) 	return 0
	else 							return userdata[ID]
}

function devGlobal()
{
	userdata = jsonfile.readFileSync("database/userdata.json")

	return userdata;
}

module.exports =
{
	userGet, sort, userSave, devGet, devGlobal
}
