const { Events, ActivityType } 	= require("discord.js")
const { Random }				= require("random-js")
const dev        				= require('../handlers/dev.js')

const random	= new Random()
const statuses 	= 
[
	{ name: "you go take the survey!"					type: ActivityType.Watching},
	{ name: "Ranked gambling.", 						type: ActivityType.Custom },
	{ name: "Never give up.", 							type: ActivityType.Custom },
	{ name: "Not rigged, probably...", 					type: ActivityType.Custom },
	{ name: "The illusion of choice.",					type: ActivityType.Custom },
	{ name: "you gambling", 							type: ActivityType.Watching },
	{ name: "your next move", 							type: ActivityType.Watching },
	{ name: "the dealers shuffling", 					type: ActivityType.Watching },
	{ name: "the security feed",						type: ActivityType.Streaming },
	{ name: "your losses in 4k", 						type: ActivityType.Streaming },
	{ name: "your downfall (with background music!)", 	type: ActivityType.Streaming },
	{ name: "your cries", 								type: ActivityType.Listening },
	{ name: "with the Chips", 							type: ActivityType.Playing },
	{ name: "with fate", 								type: ActivityType.Playing },
	{ name: "with your odds (and feelings)", 			type: ActivityType.Playing}
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
	        		statuses[0]
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
