require("dotenv").config()

const { CLIENT_ID: CID, DISCORD_TOKEN: token} 	= process.env
const { REST, Routes } 							= require("discord.js")
const fs 										= require("node:fs")
const path 										= require("node:path")

const cmds 			= []
const cmdPath		= path.join(__dirname, "commands")
const cmdFiles		= fs.readdirSync(cmdPath).filter((file) => file.endsWith(".js"))

for(const file of cmdFiles)
{
	const command = require(`./commands/${file}`)
	cmds.push(command.data.toJSON())
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => 
{
    try 
    {
        console.log(`Started refreshing ${cmds.length} (/) commands.`);
 
        const data = await rest.put( Routes.applicationCommands(CID), { body: cmds });
 
        console.log(`Successfully reloaded ${data.length} (/) commands.`);
    } 
    catch (error) 
    {
        console.error(error);
    }
})();
