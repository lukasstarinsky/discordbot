import { Client, GatewayIntentBits, EmbedBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import "dotenv/config";
import Insults from "~/data/insults";
import * as OnlineFix from "~/controllers/onlinefix";
import * as Riot from "~/controllers/riot";
import "~/register-commands";

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

client.on("ready", async () => {
    console.log("Logging in...");
    
    await OnlineFix.Init();
    await Riot.Init();

    await Riot.UpdateWatchList(client);
    setInterval(async () => {
        await Riot.UpdateWatchList(client);
    }, 1000 * 60 * 30);

    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = interaction.commandName;

    if (command === "losestreak")
        await Riot.HandleLoseStreak(interaction);
    else if (command === "insult") {
        await interaction.deferReply();

        const user = (interaction as ChatInputCommandInteraction).options.getUser("user");
        
        await interaction.editReply("<@" + user + "> " + Insults[Math.floor(Math.random() * Insults.length)]);
    } else if (command === "lol")
        await Riot.HandleSummonerData(interaction);
    else if (command === "ingame")
        await Riot.HandleIngameData(interaction);
    else if (command === "watchlist")
        await Riot.HandleWatchList(interaction);
    else if (command === "history")
        await Riot.HandleHistory(interaction);
    else if (command === "poke")
        await interaction.reply("startuj rift <@344971043720396810>");
    else if (command === "random_game")
        await OnlineFix.Handle(interaction);
});

client.login(process.env.TOKEN);
