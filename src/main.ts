import { Client, GatewayIntentBits, ChatInputCommandInteraction } from "discord.js";
import mongoose from "mongoose";
import "dotenv/config";
import { Mines } from "~/controllers/minigames";
import * as Embed from "~/utils/embed";
import * as Riot from "~/controllers/riot";
import * as Misc from "~/controllers/misc";
import * as Sound from "~/controllers/sound";
import User from "~/models/user";
import { GlobalFonts } from "@napi-rs/canvas";
import { join } from "path";
import "~/register-commands";

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once("ready", async () => {
    GlobalFonts.registerFromPath(join(__dirname, '..', "assets", 'fonts', 'rubik.ttf'), "Rubik");

    console.log("Logging in...");
    
    try {
        await mongoose.connect(`${process.env.MONGO_DB_URL}`);
        console.log("Database connected");
    } catch (err: any) {
        console.error("Failed to connect to database");
        console.error(err);
        process.exit(69);
    }
    
    await Riot.Initialize();

    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("ready", async () => {
    try {
        client.guilds.cache.forEach(async (guild) => {
            const members = await guild.members.fetch();
            
            members.forEach(async (member) => {
                if (member.user.bot) return;

                const userId = member.user.id;
                await User.findOne({ id: userId }, {}, { upsert: true });
            });
        });
    } catch (err: any) {
        console.error("Failed to create initial user data");
        console.error(err);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = interaction.commandName;

    await interaction.deferReply();
    try {
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
            case "matchhistory":
                await Riot.HandleMatchHistory(interaction as ChatInputCommandInteraction);
                break;

            // Sound
            case "play":
                await Sound.Play(interaction as ChatInputCommandInteraction);
                break;
            case "queue":
                await Sound.ListQueue(interaction as ChatInputCommandInteraction);
                break;
            case "stop":
                await Sound.Stop(interaction as ChatInputCommandInteraction);
                break;

            // Misc
            case "insult":
                await Misc.Insult(interaction as ChatInputCommandInteraction);
                break;
            case "setresponse":
                await Misc.AddMessage(interaction as ChatInputCommandInteraction);
                break;
            case "balance":
                await Misc.Balance(interaction);
                break;
            case "top10":
                await Misc.Top10(interaction);
                break;

            // MiniGames
            case "mines":
                await Mines.Handle(interaction as ChatInputCommandInteraction);
                break;
        }
    } catch (err: any) {
        if (err.response) {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Something went wrong, error code: ${err.response.status}.`)] });
        } else {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("Something went wrong.")] });
        }
        console.error(err);
    }
});

client.on("messageCreate", async (message) => {
    await Misc.CheckMessage(message);
});

client.login(process.env.TOKEN);