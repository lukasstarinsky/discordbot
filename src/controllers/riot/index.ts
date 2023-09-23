import { CommandInteraction, ChatInputCommandInteraction, EmbedBuilder, Client, TextChannel } from "discord.js";
import { DataDragon } from "data-dragon";
import * as Service from "~/services/riot";
import * as Embed from "~/utils/embed";
import Constants from "~/data/constants";
import Watchlist from "~/models/watchlist";
import History from "~/models/history";
import "~/utils/string";

// Todo: Use custom parsed json
let dragon: DataDragon;

export async function Init() {
    const watchlist = await Watchlist.findOne();
    
    if (!watchlist) {
        console.log("Creating new watchlist...");
        const watchlistNew = new Watchlist();
        await watchlistNew.save();
    }

    console.log("Fetching ddragon...");
    dragon = await DataDragon.latest();
    await dragon.champions.fetch();
    await dragon.items.fetch();
}

export async function HandleLoseStreak(interaction: CommandInteraction) {
    await interaction.deferReply();
    
    try {
        const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
        let summoner;
        
        try {
            summoner = await Service.GetSummoner(summonerName);
        } catch (err) {
            await interaction.editReply(Embed.CreateErrorEmbed(`Summoner **${summonerName}** doesn't exist.`));
            return;
        }
        const loseStreak = await Service.GetLoseStreak(summoner);
        await interaction.editReply(Embed.CreateInfoEmbed(`**${summonerName}** has lose streak of ${loseStreak} ${loseStreak == 1 ? "game": "games"}.`));
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
    await interaction.deferReply();
    
    try {
        const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
        const summoner = await Service.GetSummoner(summonerName);
        const soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner);
        const lastGame = await Service.GetLastMatch(summoner);
        const summonerLastGameStats = Service.GetSummonerStatsFromMatch(lastGame, summoner);

        if (!summoner || !soloLeagueEntry || !lastGame || !summonerLastGameStats) {
            await interaction.reply(Embed.CreateErrorEmbed("This user's data couldn't be loaded."));
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
            await interaction.editReply(Embed.CreateErrorEmbed(`**${err.response.status}** - Something went wrong.`));
        } else {
            await interaction.editReply(Embed.CreateErrorEmbed("Something went wrong."));
        }
        console.error(err);
    }
}

export async function HandleInGameData(interaction: CommandInteraction) {
    await interaction.deferReply();

    const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
    
    try {
        const summoner = await Service.GetSummoner(summonerName);
        const gameInfo = await Service.GetCurrentActiveMatch(summoner);

        if (!summoner || !gameInfo) {
            await interaction.reply(Embed.CreateErrorEmbed("This user's data couldn't be loaded."));
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

        await interaction.editReply({ embeds: [ messageEmbed ]});
    } catch (err: any) {
        if (err.response) {
            if (err.response.status == 404) {
                await interaction.editReply(Embed.CreateErrorEmbed(`**${summonerName}** is not in-game.`));
            } else {
                await interaction.editReply(Embed.CreateErrorEmbed(`**${err.response.status}** - Something went wrong.`));
                console.error(err);
            }
        } else {
            await interaction.editReply(Embed.CreateErrorEmbed("Something went wrong."));
            console.error(err);
        }
    }
}

export async function UpdateWatchList(client: Client) {
    try {
        const watchlist = await Watchlist.findOne();

        for (let summonerName of watchlist!.summoners) {
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

            await History.updateOne({ summoner: summonerName }, { $push: { history: stat } });

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
    const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";

    try {
        const watchlist = await Watchlist.findOne();

        if (action === "add") {
            if (watchlist!.summoners.includes(summonerName)) {
                await interaction.editReply(Embed.CreateErrorEmbed(`**${summonerName}** is already in watchlist.`));
                return;
            }

            try {
                const summoner = await Service.GetSummoner(summonerName);
            } catch (err) {
                await interaction.editReply(Embed.CreateErrorEmbed(`Summoner **${summonerName}** doesn't exist.`));
                return;
            }

            const history = await History.findOne({ summoner: summonerName });
            if (!history) {
                const historyNew = new History({
                    summoner: summonerName,
                    history: []
                });
                await historyNew.save();
            }
            
            await watchlist!.updateOne({ $push: { "summoners": summonerName } });
            await interaction.editReply(Embed.CreateInfoEmbed(`**${summonerName}** was added to watchlist.`));
        } else if (action === "remove") {
            if (!watchlist!.summoners.includes(summonerName)) {
                await interaction.editReply(Embed.CreateErrorEmbed(`**${summonerName}** is not in watchlist.`));
                return;
            }

            await watchlist!.updateOne({ $pull: { "summoners": summonerName } });
            await interaction.editReply(Embed.CreateInfoEmbed(`**${summonerName}** was removed from watchlist.`));
        } else {
            await interaction.editReply(Embed.CreateInfoEmbed(`Current watchlist: **${watchlist!.summoners}**`));
        }
    } catch (err: any) {
        await interaction.editReply(Embed.CreateErrorEmbed("Something went wrong."));
        console.error(err);
    }
}

export async function HandleHistory(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
        const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
        const watchlist = await Watchlist.findOne();

        if (!watchlist!.summoners.includes(summonerName)) {
            await interaction.editReply(Embed.CreateErrorEmbed(`**${summonerName}** is not in watchlist.`));
            return;
        }
        
        // Can send up to 4096 characters in embed, 100 history lines

        const history = await History.findOne({ summoner: summonerName });

        if (history!.history.length === 0) {
            await interaction.editReply(Embed.CreateErrorEmbed(`${summonerName} has no logged history yet.`));
            return;
        }

        await interaction.editReply(Embed.CreateInfoEmbed(
            history!.history.slice(-100).join("\n"),
            `${summonerName} - Last 100 games`
        ));
    } catch (err: any) {
        await interaction.editReply(Embed.CreateErrorEmbed("Something went wrong."));
        console.error(err);
    }
}