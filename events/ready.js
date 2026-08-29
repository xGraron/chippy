const { Events, ActivityType } 	= require("discord.js")
const { Random }				= require("random-js")
const dev        				= require('../handlers/dev.js')

const random	= new Random()
const statuses 	= 
[
	{ name: "work starting",					type: ActivityType.Watching},
]

const types		=
{
	0: "Playing",
	1: "Streaming",
	2: "Listening",
	3: "Watching",
	4: ""
}

module.exports = 
{
	name: Events.ClientReady,
	once: true,
	async execute(client)
	{
		await setStatus()

		dev.devTools()

		async function setStatus()
		{
			const n 		= random.integer(0, (statuses.length - 1))
			const status 	= statuses[n]
			const s_log		= (types[status.type] + " " + status.name || status.state).trimStart()
			

			client.user.setPresence(
	        { 
	        	activities: 
	        	[
	        		status
	        	], 
	        	status: 'online'
	    	});

	    	dev.log("Status: " + s_log, 1)
		}


		dev.log(`Online`, 1)

		setInterval(() =>
		{
			setStatus()
		}, 1800000)
	}
}
