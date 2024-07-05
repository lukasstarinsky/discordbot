import { REST, Routes, ApplicationCommandOptionType } from "discord.js";
import "dotenv/config";

const commands = [
    {
        name: "mines",
        description: "Start mines minigame",
        options: [
            {
                name: "bet",
                description: "Enter your bet amount",
                type: ApplicationCommandOptionType.Number,
                required: true
            }
        ]
    },
    {
        name: "movies",
        description: "Manage movie database",
        options: [
            {
                name: "action",
                description: "Select an action to perform",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "add",
                        value: "add",
                    },
                    {
                        name: "list",
                        value: "all"
                    },
                    {
                        name: "mark-watched",
                        value: "markwatched",
                    },
                    {
                        name: "random",
                        value: "random",
                    }
                ]
            },
            {
                name: "data",
                type: ApplicationCommandOptionType.String,
                description: "Movie names (comma separated)"
            }
        ]
    },
    {
        name: "balance",
        description: "Show your balance"
    },
    {
        name: "hitpoint",
        description: "Shows HitPoint stats"
    },
    {
        name: "top10",
        description: "Shows the TOP 10 users"
    },
    {
        name: "lol",
        description: "Show data of selected summoner",
        options: [
            {
                name: "summoner",
                description: "Name of the summoner",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "losestreak",
        description: "Show losestreak of selected summoner",
        options: [
            {
                name: "summoner",
                description: "Name of the summoner",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "insult",
        description: "Insults an user",
        options: [
            {
                name: "user",
                description: "User to be insulted",
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ]
    },
    {
        name: "settimer",
        description: "Sets user's ban time.",
        options: [
            {
                name: "user",
                description: "User",
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: "until",
                description: "Ban Length in days",
                type: ApplicationCommandOptionType.Number,
                required: true
            }
        ]
    },
    {
        name: "setresponse",
        description: "Sets automatic response to message.",
        options: [
            {
                name: "message",
                description: "Message containts",
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "response",
                description: "Message response",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "banclock",
        description: "Gets user's ban time.",
        options: [
            {
                name: "user",
                description: "Select user",
                type: ApplicationCommandOptionType.User,
                required: true
            }
        ]
    },
    {
        name: "ingame",
        description: "Show ingame summoner info",
        options: [
            {
                name: "summoner",
                description: "Name of the summoner",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "play",
        description: "Plays a sound",
        options: [
            {
                name: "url",
                description: "URL of the sound",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    },
    {
        name: "stop",
        description: "Stops a sound",
    },
    {
        name: "queue",
        description: "Lists the queue",
    },
    {
        name: "randomgame",
        description: "Show random game from online-fix.me"
    },
    {
        name: "watchlist",
        description: "'Add to', 'Remove from' or 'View' the current watchlist",
        options: [
            {
                name: "action",
                description: "Action to perform on watchlist",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: "add", value: "add" },
                    { name: "remove", value: "remove" },
                    { name: "current", value: "current" },
                ]
            },
            {
                name: "summoner",
                description: "Name of the summoner",
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },
    {
        name: "history",
        description: "Get history of selected summoner (must be in watchlist)",
        options: [
            {
                name: "summoner",
                description: "Name of the summoner",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "poke",
        description: "Notifies discord user 'Tonski' to hop on League"
    }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);

(async () => {
    try {
        console.log("Registering commands...");
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), { body: commands });
    } catch (err) {
        console.log(err);
    }
})();
