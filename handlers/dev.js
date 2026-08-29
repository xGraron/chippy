const readline  = require("readline");
const fs        = require("fs")
const path      = require("path")

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
