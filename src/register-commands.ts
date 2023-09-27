import { REST, Routes, ApplicationCommandOptionType } from "discord.js";
import "dotenv/config";

const commands = [
    {
        name: "minigame",
        description: "Start a minigame",
        options: [
            { 
                name: "game",
                description: "Select a game to start",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { 
                        name: "mines", 
                        value: "mines",
                        description: "Minesweeper Minigame"
                    },
                ]
            },
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
                        name: "list-watched",
                        value: "watched",
                    },
                    {
                        name: "list-not-watched",
                        value: "notwatched",
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
