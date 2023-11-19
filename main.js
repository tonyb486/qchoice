
const QChooser = require("./qchooser")
const irc = require("irc");

// Load configuration
const config = require("./config")

// Randomness source
qc = new QChooser(config.api_key)

// IRC Cient
var bot = new irc.Client(config.server, config.nick, {
	channels: config.channels,
    userName: config.username
});

// Set +B
bot.addListener("registered", function() {
    bot.send("MODE", config.nick, "+B")
})

// Listen for choice requests
bot.addListener("message", async function(from, to, text, message) {

    try {

        // Only messages to a channel we expect
        if(!config.channels.includes(to))
            return

        // Ignore known bots
        if(config.ignore.includes(from.toLowerCase()))
            return

        // Match requests ending in a question mark
        const request = text.match(/^qchoice: ([\p{Letter}\d, ]+)\?$/u)
        if(!request) 
            return

        // Split by comma, 'or', or some combinations
        const choices = request[1].split(/,\s*or\s+|\s+or\*,|\s*,\s*|\s+or\s+/)
        
        // For single choices, yes or no questions or a command
        if(choices.length == 1) {

            // State of the entropy pool
            if (choices[0] == "pool") {
                if(qc.updated) {
                    var updated = new Date(qc.updated).toISOString()
                    var response = "Entropy pool last updated "+updated+"; Currently "+qc.randPool.length+" bytes in pool."
                    bot.say(to, from+": "+response)
                } else {
                    bot.say(to, from+": Entropy pool not initiaized.")
                }
                return
            }

            // Bot's source code
            if (choices[0] == "source") {
                bot.say(to, from+": https://github.com/tonyb486/qchoice")
                return
            }

            // Help
            if (choices[0] == "help") {
                bot.say(to, from+": I make choices for you based on quantum randomness. Together, we make parallel universes.")
                return
            }

            // Help
            if (choices[0] == "entropy") {
                bot.say(to, from+": I get my randomness from https://quantumnumbers.anu.edu.au/ :)")
                return
            }
            
            // Yes or no questions
            var choice = await qc.choice(["Sure!", "Nope!"])
            bot.say(to, from+": "+choice)
            return
        }

        // Regular choices
        var choice = await qc.choice(choices)
        bot.say(to, from+": "+choice)
    
    } catch(e) {
        bot.say(to, "I have hurt myself in my confusion. Please try again later.")
        console.log(e)
    }
});