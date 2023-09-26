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
                    { name: "mines", value: "game_mines" },
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
                    { name: "add", value: "watchlist_add" },
                    { name: "remove", value: "watchlist_remove" },
                    { name: "current", value: "watchlist_current" },
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
