const readline  = require("readline");
const fs        = require("fs")
const path      = require("path")
const dh        = require('../handlers/dataHandler.js')
const jsonfile	= require("jsonfile")

const rl = readline.createInterface(
{
    input: process.stdin,
    output: process.stdout,
    prompt: '- '
});
    
let errors = 0

async function devTools()
{
    rl.prompt();

    rl.on('line', (line) => 
    {
        const input     = line.trim();
        const args      = input.split(" ")
        const command   = args.shift()


        switch (command) 
        {
            case "code":
            {
                const codes             = jsonfile.readFileSync("database/codes.json")
                const [ code, value ]   = args

                if(!code || !value)
                {
                    log("Usage: code <name> <value> \nExample: \ncode testing 500", 2)
                    break;
                }

                codes[code] = value

                jsonfile.writeFileSync("database/codes.json", codes)

                log(`Successfully added ${code}`, 3)

                break;
            }

            case "set":
            {
                const [ UID, key, value ] = args;
                
                if(!UID || !key || value === undefined)
                {
                    log("Usage: set <id> <property> <value> \nExample: \nset 467019235328000001 chips 100", 2)
                    break;
                }

                let parsedVal;
                if(value === "true")        parsedVal = true
                else if(value === "false")  parsedVal = false
                else if(!isNaN(value))      parsedVal = Number(value)
                else                        parsedVal = value
            

                if(UID === "all")
                {
                    const database = dh.devGlobal()

                    let updated = 0

                    for(const userID in database)
                    {
                        const userStats = database[userID]

                        if (!(key in userStats))
                        {
                            log("Key not found!", 5)
                            break;
                        }

                        userStats[key] = parsedVal;
                        updated++

                        dh.userSave(userStats)
                    }

                    log(`Successfully set ${key} to ${parsedVal}`, 3)

                    break;
                }
                else
                {
                    const userStats = dh.devGet(UID)

                    if (userStats === 0) 
                    {
                        log("User not found!", 5)
                        break;
                    }
                    else if(!(key in userStats))
                    {
                        log("Key not found!", 5)
                        break;
                    }

                    userStats[key] = parsedVal

                    dh.userSave(userStats)

                    log(`Successfully set ${userStats.userID}.${key} to ${userStats[key]}`, 3)

                    break;
                }
            }

            case "get":
            {
                const [ UID, key ] = args

                if(!UID)
                {
                    log("Usage: get <id> \nExample: \nget 467019235328000001", 2)
                    break;
                }

                const userStats = dh.devGet(UID)

                if(userStats === 0)
                {
                    log("User not found!", 5)
                    break;
                }
                if(userStats[key])  log('\n' + JSON.stringify(userStats[key], null, 2), 3)
                else                log('\n' + JSON.stringify(userStats, null, 2), 3)

                break;
            }

            case "backup":
            {
                const date  = new Date().toISOString().split('T')[0]
                const src   = path.join("database", "userdata.json")
                const dest  = path.join("database", "backups", `backup_${date}.json`)

                fs.copyFileSync(src, dest)

                log("Successfully backed up Database " + date, 3)

                break;
            }

            case "errors":
            {
                log("Amount of errors logged since last restart: " + errors, 3)

                break;
            }

            default: { log(`Unknown command: ${input}`, 5) }
        }

        rl.prompt();
    }).on('close', () => 
    {
        log('Offline', 1);

        process.exit(0);
    });
}


async function log(content, index = 0)
{
    const reset     = "\x1b[0m";
    const colors    = 
    [
        "",         //none
        "\x1b[90m", //gray
        "\x1b[31m", //red
        "\x1b[32m", //green
        "\x1b[36m", //cyan
        "\x1b[35m", //magenta
    ]

    const color = colors[index]

    const now       = new Date()
    const months    = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const pad       = n => String(n).padStart(2, "0")

    const s     = pad(now.getSeconds())
    const m     = pad(now.getMinutes())
    const h     = pad(now.getHours())
    const d     = pad(now.getDate())
    const mo    = months[now.getMonth()]

    const date  = `<${d}-` + `${mo} ` + `${h}:`+ `${m}:` + `${s}>`

    readline.clearLine(process.stdout, 0)       
    readline.cursorTo(process.stdout, 0)      

    console.log(color + date + reset, content)

    if(index === 2)
    {
        fs.appendFileSync("./database/errors.txt", date + content + "\n")
        errors ++
    } 

    rl.prompt(true);                             
}

module.exports =
{
    log, devTools
}
