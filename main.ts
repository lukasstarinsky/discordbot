import { Client, GatewayIntentBits, EmbedBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import { Constants } from "./utils/constants";
import { DataDragon } from "data-dragon";
import { Game } from "./onlinefixme/game.type";
import * as LOL from "./riotapi/api";
import * as OFME from "./onlinefixme/api";
import fs from "fs";

import "./register-commands";
import "dotenv/config";
import "./utils/string";
import "./utils/dictionary";

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

let dragon: DataDragon;

let watchlist: string[] = [];
let games: Game[] = [];

const LoadWatchList = () => {
    if (!fs.existsSync("./data/watchlist.txt")) {
        fs.mkdirSync("./data");
        fs.writeFileSync("./data/watchlist.txt", "", { flag: "w" }); 
        return;
    }

    watchlist.length = 0;
    fs.readFileSync("./data/watchlist.txt", "utf8").toString().trim().split("\n").forEach(name => {
        if (name !== "" && !watchlist.includes(name)) {
            watchlist.push(name);
        }
    });
};

const UpdateWatchlist = async () => {
    try {
        for (let summonerName of watchlist) {
            const summoner = await LOL.GetSummoner(summonerName);
            const soloLeagueEntry = await LOL.GetSoloLeagueEntry(summoner);

            if (!summoner || !soloLeagueEntry) {
                return;
            }

            const stat = new Date().toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h24',
                timeZone: 'Europe/Bratislava'
            }) + " - " + soloLeagueEntry.tier + " " + soloLeagueEntry.rank + " " + soloLeagueEntry.leaguePoints;

            fs.appendFile(`./data/${summonerName}.txt`, stat + "\n", (err) => {
                if (err) console.error(err);
            });

            const general = await client.channels.fetch(Constants.TC_GENERAL) as TextChannel;
            const tonski = general.members.get("344971043720396810");

            if (summonerName === "Tonski" && soloLeagueEntry.tier === "DIAMOND") {
                tonski?.setNickname("winton boosted diamondski");
                general.send(Constants.LOSE_ICON);
                return general.send("Achtung achtung, tonski was carried to diamond");        
            } else if (summonerName === "Tonski" && soloLeagueEntry.tier === "GOLD") {
                tonski?.setNickname("winton goldski");
                general.send(Constants.LOSE_ICON);
                const embed = {
                    "title": `Tonski - Announcement`,
                    "description": "<@908823905878290452> <@208217888560119809> <@390580146299600896> <@482094133255733259> \n!!! TONSKI HAS REACHED GOLD !!!",
                    "color": 0x00FFFF
                }
                return general.send({ "embeds": [embed] });
            }
        }
    } catch (err: any) {
        console.error(err);
    }
};

client.on("ready", async () => {
    console.log("Logging in...");
    
    console.log("Fetching ddragon...");
    dragon = await DataDragon.latest();
    await dragon.champions.fetch();
    await dragon.items.fetch();

    console.log("Loading games...");
    try {
        games = await OFME.LoadGames();
    } catch(err) {
        console.log("Failed to load games.");
    }
    console.log("Games loaded.");

    LoadWatchList();

    await UpdateWatchlist();
    setInterval(async () => {
        await UpdateWatchlist();
    }, 1000 * 60 * 30);

    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = interaction.commandName;

    if (command === "losestreak") {
        try {
            await interaction.deferReply();

            const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
            const summoner = await LOL.GetSummoner(summonerName);
            const matchIds = await LOL.GetMatchHistory(summoner);

            let loseStreak = 0;
            loopOuter: for (let matchId of matchIds) {
                const match = await LOL.GetMatch(matchId);
                
                if (match.info.queueId != 420)
                    continue;

                for (let participant of match.info.participants) {
                    if (participant.summonerName === "Tonski") {
                        if (participant.win)
                            break loopOuter;
                        
                        loseStreak++;
                    }
                }
            }

            const messageEmbed = new EmbedBuilder()
                .setTitle(`${summonerName} has lose streak of ${loseStreak} ${loseStreak == 1 ? "game": "games"}.`)
                .setColor(0x00fdfd);

            await interaction.editReply({ embeds: [messageEmbed] });
        } catch (err: any) {
            if (err.response) {
                await interaction.editReply(err.response.status + " - Something went wrong.");
            } else {
                await interaction.editReply("Something went wrong.");
            }
            console.error(err);
        }
    } else if (command === "lol") {
        try {
            await interaction.deferReply();

            const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
            const summoner = await LOL.GetSummoner(summonerName);
            const soloLeagueEntry = await LOL.GetSoloLeagueEntry(summoner);
            const lastGame = await LOL.GetLastMatch(summoner);
            const summonerLastGameStats = LOL.GetSummonerStatsFromMatch(lastGame, summoner);

            if (!summoner || !soloLeagueEntry || !lastGame || !summonerLastGameStats) {
                await interaction.reply("This user's data couldn't be loaded.");
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
            const champion = summonerLastGameStats.championName;
            const lane = summonerLastGameStats.lane;

            const messageEmbed = new EmbedBuilder()
                .setTitle(summoner.name)
                .setColor(summonerLastGameStats.win ? 0x00FF00 : 0xFF0000)
                .setFields(
                    { name: "Rank", value: `**${soloLeagueEntry.tier.toLowerCase().capitalize()} ${soloLeagueEntry.rank}** ${soloLeagueEntry.leaguePoints} LP`, inline: true },
                    { name: "W/L", value: `${soloLeagueEntry.wins}W/${soloLeagueEntry.losses}L`, inline: true },
                    { name: "WR", value: `${winrate.toFixed(2)}%`, inline: true },
                    { name: "Time Played", value: timePlayed },
                    { name: "Score", value: `${summonerLastGameStats.kills}/${summonerLastGameStats.deaths}/${summonerLastGameStats.assists}`, inline: true },
                    { name: "KDA", value: kda.toFixed(2), inline: true },
                    { name: "KP", value: `${kp.toFixed(2)}%`, inline: true },
                    { name: "Damage dealt", value: `${summonerLastGameStats.totalDamageDealtToChampions.toString()}, which is ${damagePercentage.toFixed(2)}% of team total` },
                    { name: "CS Advantage", value: hadCSAdvantage ? "Yes": "No", inline: true },
                    { name: "CS First 10 minutes", value: `${csFirstTenMinutes}`, inline: true },
                    { name: "Role", value: `**${champion}** - ${lane}` }
                )
                .setThumbnail(Constants.CHAMP_ICON + summonerLastGameStats.championName + ".png")
                .setImage(summonerLastGameStats.summonerName === "Tonski" && !summonerLastGameStats.win ? Constants.LOSE_ICON : null)
                .setFooter({
                    text: `${gameType}${new Date(lastGame.info.gameEndTimestamp).toLocaleString('en-Gb', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hourCycle: 'h24',
                        timeZone: 'Europe/Bratislava'
                    })}`
                });
            await interaction.editReply({ embeds: [messageEmbed ]});
        } catch (err: any) {
            if (err.response) {
                await interaction.editReply(err.response.status + " - Something went wrong.");
            } else {
                await interaction.editReply("Something went wrong.");
            }
            console.error(err);
        }
    } else if (command === "ingame") {
        const summonerInput = (interaction as ChatInputCommandInteraction).options.getString("summoner");
        
        try {
            await interaction.deferReply();


            const summonerName = summonerInput || "Tonski";
            const summoner = await LOL.GetSummoner(summonerName);
            const gameInfo = await LOL.GetCurrentActiveMatch(summoner);

            if (!summoner || !gameInfo) {
                await interaction.reply("This user's data couldn't be loaded.");
                return;
            }

            //console.log(gameInfo);

            //const timeElapsed = gameInfo.gameLength + 180;
            const timeElapsed = (Date.now().valueOf() - gameInfo.gameStartTime) / 1000;
            const minutes = String(Math.floor(timeElapsed / 60));
            const seconds = String(Math.floor(timeElapsed % 60)).padStart(2, '0');
            
            let bans: string = "";
            let teams: Dictionary<string> = {};

            let messageEmbed = new EmbedBuilder()
                .setTitle(summoner.name)
                .setColor(0x00FF00)
                .setFields(
                    { name: "Time Elapsed", value: `${minutes}:${seconds}`},
                )

            for (let participant of gameInfo.participants) {
                const participantChamp = dragon.champions.find((champion) => champion.key === String(participant.championId))

                if (teams[participant.teamId] == null) teams[participant.teamId] = "";

                teams[participant.teamId] += "**" + participant.summonerName + "** - " + participantChamp?.name + "\n";
            }
                
            let i = 1;
            Object.entries(teams).forEach(
                ([key, value]) => {
                    messageEmbed.addFields(
                        { name: `Team ${i}`, value: `${value}`, inline: true}
                    )
                    ++i;
                }
            );

            /*for (let participant of gameInfo.participants) {
                const participantChamp = dragon.champions.find((champion) => champion.key === String(participant.championId))

                messageEmbed.addFields(
                    { name: `${participant.summonerName}`, value: `${participantChamp?.name}`, inline: true}
                )
            }*/

            for (let banned of gameInfo.bannedChampions) {
                const bannedChamp = dragon.champions.find((champion) => champion.key === String(banned.championId))

                bans += bannedChamp?.name + "\n";
            }
            
            messageEmbed.addFields(
                { name: `Banned`, value: `${bans}`, inline: false}
            )

            await interaction.editReply({ embeds: [messageEmbed ]});
        } catch (err: any) {
            if (err.response) {
                if (err.response.status == 404) {
                    await interaction.editReply(summonerInput + " is not in-game.");
                } else {
                    await interaction.editReply(err.response.status + " - Something went wrong.");
                    console.error(err);
                }
            } else {
                await interaction.editReply("Something went wrong.");
                console.error(err);
            }
        }
    } else if (command === "watchlist") {
        const action = (interaction as ChatInputCommandInteraction).options.getString("action") || "current";
        const summoner = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";

        if (action === "add") {
            if (watchlist.includes(summoner)) {
                await interaction.reply(`${summoner} is already in watchlist.`);
                return;
            }

            fs.appendFile("./data/watchlist.txt", summoner + "\n", (err) => {
                if (err) return console.error(err);
                LoadWatchList();
            });
            await interaction.reply(`${summoner} was added to watchlist.`);
        } else if (action === "remove") {
            if (!watchlist.includes(summoner)) {
                await interaction.reply(`${summoner} is not in watchlist.`);
                return;
            }

            fs.readFile("./data/watchlist.txt", "utf8", (err, data) => {
                if (err) return console.error(err);

                const newData = data.trim().split("\n").filter(name => {
                    return name !== summoner;
                }).join("\n");

                fs.writeFile("./data/watchlist.txt", newData, "utf8", err => {
                    if (err) return console.error(err);
                    LoadWatchList();
                    interaction.reply(`${summoner} was removed from watchlist.`);
                });
            });
            fs.unlink(`./data/${summoner}.txt`, err => {
                if (err) return console.error(err);
            });
        } else {
            await interaction.reply("Current watchlist: " + watchlist);
        }
    } else if (command === "history") {
        const summoner = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";

        if (!watchlist.includes(summoner)) {
            await interaction.reply(`${summoner} is not in watchlist.`);
            return;
        }

        fs.readFile(`./data/${summoner}.txt`, "utf8", (err, data) => {
            if (err) {
                interaction.reply(`${summoner} has no logged history yet.`);
                return;
            }

            interaction.reply({ "embeds": [
                {
                  "title": `${summoner} - History`,
                  "description": data.split("\n").slice(-25).join("\n"),
                  "color": 0x00FFFF
                }
            ] })
        });
    } else if (command === "poke") {
        await interaction.reply("startuj rift <@344971043720396810>");
    } else if (command === "random_game") {
        const randGame: Game = games[Math.floor(Math.random() * games.length)];

        const messageEmbed = new EmbedBuilder()
            .setTitle("Random Game")
            .setColor(0x00fdfd)
            .setFields(
                { name: "Name", value: randGame.name },
                { name: "Link", value: randGame.link },
            )
            .setImage(randGame.imageUrl);

        await interaction.reply({ embeds: [messageEmbed] });
    }
});

client.login(process.env.TOKEN);
