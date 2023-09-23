import { CommandInteraction, ChatInputCommandInteraction, EmbedBuilder, Client, TextChannel } from "discord.js";
import { DataDragon } from "data-dragon";
import fs from "fs";
import * as Service from "~/services/riot";
import Constants from "~/data/constants";

let watchlist: string[] = [];
let dragon: DataDragon;

const LoadWatchList = () => {
    if (!fs.existsSync("./data/watchlist.txt")) {
        fs.writeFileSync("./data/watchlist.txt", "", { flag: "w" }); 
        return;
    }

    watchlist.length = 0;
    fs.readFileSync("./data/watchlist.txt", "utf8").toString().trim().split("\n").forEach(name => {
        if (name !== "" && !watchlist.includes(name)) {
            watchlist.push(name);
        }
    });
}

export async function Init() {
    LoadWatchList();

    console.log("Fetching ddragon...");
    dragon = await DataDragon.latest();
    await dragon.champions.fetch();
    await dragon.items.fetch();
}

export async function HandleLoseStreak(interaction: CommandInteraction) {
    try {
        await interaction.deferReply();

        const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
        const summoner = await Service.GetSummoner(summonerName);
        const matchIds = await Service.GetMatchHistory(summoner);

        let loseStreak = 0;
        loopOuter: for (let matchId of matchIds) {
            const match = await Service.GetMatch(matchId);
            
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
}

export async function HandleSummonerData(interaction: CommandInteraction) {
    try {
        await interaction.deferReply();

        const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
        const summoner = await Service.GetSummoner(summonerName);
        const soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner);
        const lastGame = await Service.GetLastMatch(summoner);
        const summonerLastGameStats = Service.GetSummonerStatsFromMatch(lastGame, summoner);

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
}

export async function HandleIngameData(interaction: CommandInteraction) {
    const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
    
    try {
        await interaction.deferReply();
        
        const summoner = await Service.GetSummoner(summonerName);
        const gameInfo = await Service.GetCurrentActiveMatch(summoner);

        if (!summoner || !gameInfo) {
            await interaction.reply("This user's data couldn't be loaded.");
            return;
        }

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
            );

        for (let participant of gameInfo.participants) {
            const participantChamp = dragon.champions.find((champion) => champion.key === String(participant.championId))

            if (teams[participant.teamId] == null) teams[participant.teamId] = "";

            teams[participant.teamId] += `**${participant.summonerName}** - ${participantChamp?.name}\n`;
        }
            
        let i = 1;
        Object.entries(teams).forEach(([key, value]) => {
            messageEmbed.addFields(
                { name: `Team ${i}`, value: `${value}`, inline: true}
            )
            ++i;
        });

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
        );

        await interaction.editReply({ embeds: [messageEmbed ]});
    } catch (err: any) {
        if (err.response) {
            if (err.response.status == 404) {
                await interaction.editReply(summonerName + " is not in-game.");
            } else {
                await interaction.editReply(err.response.status + " - Something went wrong.");
                console.error(err);
            }
        } else {
            await interaction.editReply("Something went wrong.");
            console.error(err);
        }
    }
}

export async function UpdateWatchList(client: Client) {
    try {
        for (let summonerName of watchlist) {
            const summoner = await Service.GetSummoner(summonerName);
            const soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner);

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
                const embed = {
                    "title": `Tonski - Announcement`,
                    "description": "<@908823905878290452> <@208217888560119809> <@390580146299600896> <@482094133255733259> \n!!! TONSKI WAS CARRIED TO DIAMOND !!!",
                    "color": 0x00FFFF
                }
                return general.send({ "embeds": [embed] });       
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

export async function HandleWatchList(interaction: CommandInteraction) {
    await interaction.deferReply();

    const action = (interaction as ChatInputCommandInteraction).options.getString("action") || "current";
    const summoner = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";

    if (action === "add") {
        if (watchlist.includes(summoner)) {
            await interaction.editReply(`${summoner} is already in watchlist.`);
            return;
        }

        fs.appendFile("./data/watchlist.txt", summoner + "\n", (err) => {
            if (err) return console.error(err);
            LoadWatchList();
        });
        await interaction.editReply(`${summoner} was added to watchlist.`);
    } else if (action === "remove") {
        if (!watchlist.includes(summoner)) {
            await interaction.editReply(`${summoner} is not in watchlist.`);
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
                interaction.editReply(`${summoner} was removed from watchlist.`);
            });
        });
        fs.unlink(`./data/${summoner}.txt`, err => {
            if (err) return console.error(err);
        });
    } else {
        await interaction.editReply("Current watchlist: " + watchlist);
    }
}

export async function HandleHistory(interaction: CommandInteraction) {
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
        ] });
    });
}