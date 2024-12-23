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
                name: "account",
                description: "Account name (including tag)",
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "region",
                description: "Account region (eun1, euw1, na1), default: eun1",
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },
    {
        name: "losestreak",
        description: "Show losestreak of selected summoner",
        options: [
            {
                name: "account",
                description: "Account name (including tag)",
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "region",
                description: "Account region (eun1, euw1, na1), default: eun1",
                type: ApplicationCommandOptionType.String,
                required: false
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
                name: "account",
                description: "Account name (including tag)",
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "region",
                description: "Account region (eun1, euw1, na1), default: eun1",
                type: ApplicationCommandOptionType.String,
                required: false
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
