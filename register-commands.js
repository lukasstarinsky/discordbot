"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const commands = [
    {
        name: "lol",
        description: "Show data of selected summoner",
        options: [
            {
                name: "summoner",
                description: "Name of the summoner",
                type: discord_js_1.ApplicationCommandOptionType.String,
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
                type: discord_js_1.ApplicationCommandOptionType.String,
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
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "random_game",
        description: "Show random game from online-fix.me"
    },
    {
        name: "watchlist",
        description: "'Add to', 'Remove from' or 'View' the current watchlist",
        options: [
            {
                name: "action",
                description: "Options: [ add / remove / current ]",
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: "summoner",
                description: "Name of the summoner",
                type: discord_js_1.ApplicationCommandOptionType.String,
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
                type: discord_js_1.ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: "poke",
        description: "Notifies discord user 'Tonski' to hop on League"
    }
];
const rest = new discord_js_1.REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log("Registering commands...");
        await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    }
    catch (err) {
        console.log(err);
    }
})();
