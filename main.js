"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const constants_1 = require("./utils/constants");
const API = __importStar(require("./riotapi/api"));
const fs_1 = __importDefault(require("fs"));
require("dotenv/config");
require("./utils/string");
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.GuildMembers, discord_js_1.GatewayIntentBits.MessageContent] });
let watchlist = [];
const LoadWatchList = () => {
    watchlist.length = 0;
    fs_1.default.readFileSync("./data/watchlist.txt", "utf8").toString().trim().split("\n").forEach(name => {
        if (name !== "" && !watchlist.includes(name)) {
            watchlist.push(name);
        }
    });
};
const UpdateWatchlist = async () => {
    try {
        for (let summonerName of watchlist) {
            const summoner = await API.GetSummoner(summonerName);
            const soloLeagueEntry = await API.GetSoloLeagueEntry(summoner);
            const stat = new Date().toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h24',
                timeZone: 'Europe/Bratislava'
            }) + " - " + soloLeagueEntry.tier + " " + soloLeagueEntry.rank + " " + soloLeagueEntry.leaguePoints;
            fs_1.default.appendFile(`./data/${summonerName}.txt`, stat + "\n", (err) => {
                if (err)
                    console.error(err);
            });
            if (summonerName === "Tonski" && soloLeagueEntry.tier === "GOLD") {
                const general = await client.channels.fetch(constants_1.Constants.TC_GENERAL);
                const tonski = general.members.get("344971043720396810");
                tonski?.setNickname("winton goldski");
                general.send(constants_1.Constants.LOSE_ICON);
                const embed = {
                    "title": `Tonski - Announcement`,
                    "description": "<@908823905878290452> <@208217888560119809> <@390580146299600896> <@482094133255733259> \n!!! TONSKI HAS REACHED GOLD !!!",
                    "color": 0x00FFFF
                };
                return general.send({ "embeds": [embed] });
            }
        }
    }
    catch (err) {
        console.error(err);
    }
};
client.on("ready", async () => {
    console.log(`Logging in...`);
    LoadWatchList();
    await UpdateWatchlist();
    setInterval(async () => {
        await UpdateWatchlist();
    }, 1000 * 60 * 30);
    console.log(`Logged in as ${client.user?.tag}!`);
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand())
        return;
    const command = interaction.commandName;
    if (command === "lol") {
        try {
            const summonerName = interaction.options.getString("summoner") || "Tonski";
            const summoner = await API.GetSummoner(summonerName);
            const soloLeagueEntry = await API.GetSoloLeagueEntry(summoner);
            const lastGame = await API.GetLastMatch(summoner);
            const summonerLastGameStats = API.GetSummonerStatsFromMatch(lastGame, summoner);
            if (!summoner || !soloLeagueEntry || !lastGame || !summonerLastGameStats) {
                interaction.reply("This user's data couldn't be loaded.");
                return;
            }
            const challenges = summonerLastGameStats.challenges;
            const kda = challenges.kda;
            const winrate = (soloLeagueEntry.wins / (soloLeagueEntry.wins + soloLeagueEntry.losses)) * 100;
            const damagePercentage = challenges.teamDamagePercentage * 100;
            const kp = challenges.killParticipation * 100;
            const hadCSAdvantage = challenges.maxCsAdvantageOnLaneOpponent > 0;
            const csFirstTenMinutes = challenges.laneMinionsFirst10Minutes;
            const gameType = lastGame.info.queueId == 420 ? "SoloQ - " : lastGame.info.queueId == 440 ? "FlexQ - " : "";
            const seconds = summonerLastGameStats.timePlayed % 60;
            const secondsPlayed = seconds < 10 ? String(seconds).padStart(2, "0") : String(seconds);
            const timePlayed = `${Math.floor(summonerLastGameStats.timePlayed / 60)}:${secondsPlayed}`;
            const messageEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(summoner.name)
                .setColor(summonerLastGameStats.win ? 0x00FF00 : 0xFF0000)
                .setFields({ name: "Rank", value: `${soloLeagueEntry.tier.toLowerCase().capitalize()} ${soloLeagueEntry.rank} ${soloLeagueEntry.leaguePoints} LP`, inline: true }, { name: "W/L", value: `${soloLeagueEntry.wins}W/${soloLeagueEntry.losses}L`, inline: true }, { name: "WR", value: `${winrate.toFixed(2)}%`, inline: true }, { name: "Time Played", value: timePlayed }, { name: "Score", value: `${summonerLastGameStats.kills}/${summonerLastGameStats.deaths}/${summonerLastGameStats.assists}`, inline: true }, { name: "KDA", value: kda.toFixed(2), inline: true }, { name: "KP", value: `${kp.toFixed(2)}%`, inline: true }, { name: "Damage dealt", value: `${summonerLastGameStats.totalDamageDealtToChampions.toString()}, which is ${damagePercentage.toFixed(2)}% of team total` }, { name: "CS Advantage", value: hadCSAdvantage ? "Yes" : "No", inline: true }, { name: "CS First 10 minutes", value: `${csFirstTenMinutes}`, inline: true })
                .setThumbnail(constants_1.Constants.CHAMP_ICON + summonerLastGameStats.championName + ".png")
                .setImage(summonerLastGameStats.summonerName === "Tonski" && !summonerLastGameStats.win ? constants_1.Constants.LOSE_ICON : null)
                .setFooter({
                text: `${gameType}${new Date(lastGame.info.gameEndTimestamp).toLocaleString('en-US', {
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h24',
                    timeZone: 'Europe/Bratislava'
                })}`
            });
            interaction.reply({ embeds: [messageEmbed] });
        }
        catch (err) {
            if (err.response) {
                interaction.reply(err.response.status + " - Something went wrong.");
            }
            else {
                interaction.reply("Something went wrong.");
            }
            console.error(err);
        }
    }
    else if (command === "watchlist") {
        const action = interaction.options.getString("action") || "add";
        const summoner = interaction.options.getString("summoner") || "Tonski";
        if (action === "add") {
            fs_1.default.appendFile("./data/watchlist.txt", summoner + "\n", (err) => {
                if (err)
                    return console.error(err);
                LoadWatchList();
            });
            interaction.reply(`${summoner} was added to watchlist.`);
        }
        else if (action === "remove") {
            fs_1.default.readFile("./data/watchlist.txt", "utf8", (err, data) => {
                if (err)
                    return console.error(err);
                const newData = data.trim().split("\n").filter(name => {
                    return name !== summoner;
                }).join("\n");
                fs_1.default.writeFile("./data/watchlist.txt", newData, "utf8", err => {
                    if (err)
                        return console.error(err);
                    LoadWatchList();
                });
            });
            fs_1.default.unlink(`./data/${summoner}.txt`, err => {
                if (err)
                    return console.error(err);
            });
            interaction.reply(`${summoner} was removed from watchlist.`);
        }
        else {
            interaction.reply("Current watchlist: " + watchlist);
        }
    }
    else if (command === "history") {
        const summoner = interaction.options.getString("summoner") || "Tonski";
        if (!watchlist.includes(summoner)) {
            interaction.reply(`${summoner} is not in watchlist.`);
            return;
        }
        fs_1.default.readFile(`./data/${summoner}.txt`, "utf8", (err, data) => {
            if (err)
                return console.error(err);
            interaction.reply({ "embeds": [
                    {
                        "title": `${summoner} - History`,
                        "description": data.split("\n").slice(-25).join("\n"),
                        "color": 0x00FFFF
                    }
                ] });
        });
    }
});
client.login(process.env.TOKEN);
