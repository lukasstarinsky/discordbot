import { Client, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import mongoose from "mongoose";
import "dotenv/config";
import * as OnlineFix from "~/controllers/onlinefix";
import * as Riot from "~/controllers/riot";
import * as Misc from "~/controllers/misc";
import * as Minigame from "~/controllers/minigames";
import "~/register-commands";

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

client.on("ready", async () => {
    console.log("Logging in...");
    
    try {
        await mongoose.connect(`${process.env.MONGO_DB_URL}`);
        console.log("Database connected");
    } catch (err: any) {
        console.error("Failed to connect to database");
        console.error(err);
        process.exit(69);
    }
    
    await OnlineFix.Init();
    await Riot.Init();
    await Riot.UpdateWatchList(client);
    setInterval(async () => {
        await Riot.UpdateWatchList(client);
    }, 1000 * 60 * 15);

    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = interaction.commandName;

    switch (command) {
        // Riot
        case "losestreak":
            await Riot.HandleLoseStreak(interaction as ChatInputCommandInteraction);
            break;
        case "lol":
            await Riot.HandleSummonerData(interaction as ChatInputCommandInteraction);
            break;
        case "ingame":
            await Riot.HandleInGameData(interaction as ChatInputCommandInteraction);
            break;
        case "watchlist":
            await Riot.HandleWatchList(interaction as ChatInputCommandInteraction);
            break;
        case "history":
            await Riot.HandleHistory(interaction as ChatInputCommandInteraction);
            break;

        // Misc
        case "insult":
            await Misc.Insult(interaction as ChatInputCommandInteraction);
            break;
        case "poke":
            await Misc.Poke(interaction);
            break;

        // OnlineFix
        case "randomgame":
            await OnlineFix.Handle(interaction);
            break;

        // MiniGames
        case "minigame":
            await Minigame.Handle(interaction as ChatInputCommandInteraction);           
            break;
    }
});

client.login(process.env.TOKEN);