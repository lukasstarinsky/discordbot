import { ChatInputCommandInteraction, EmbedBuilder, Client, TextChannel, AttachmentBuilder } from "discord.js";
import fs from "fs";
import axios from "axios";
import Canvas from "@napi-rs/canvas";
import { DataDragon } from "data-dragon";
import { LeagueEntryDTO } from "~/types/riot";
import * as Service from "~/services/riot";
import * as Embed from "~/utils/embed";
import Constants from "~/data/constants";
import BotData from "~/models/botdata";
import History from "~/models/history";
import "~/utils/string";

// Todo: Use custom parsed json
let dragon: DataDragon;
let liveGameBackground: Canvas.Image;
const playerRect = {
    x: 240, 
    y: 6, 
    w: 249,
    h: 456,
    spacing: 296,
    centerX: 240 + (249 / 2),
    centerY: 6 + (456 / 2)
};

const playerRect2 = {
    x: 240, 
    y: 529, 
    w: 249,
    h: 456,
    spacing: 296,
    centerX: 240 + (249 / 2),
    centerY: 529 + (456 / 2)
};

export async function Init() {
    console.log("Fetching ddragon...");
    dragon = await DataDragon.latest();
    await dragon.champions.fetch();
    await dragon.items.fetch();

    if (!fs.existsSync("./assets/champions")) {
        console.log("Downloading champion images...");

        fs.mkdirSync("./assets/champions");
        dragon.champions.forEach(async (champion) => {
            const response = await axios(Constants.CHAMP_ICON + champion.image.full, { method: "GET", responseType: "stream"});
            response.data.pipe(fs.createWriteStream(`./assets/champions/${champion.image.full}`));
        });

        console.log("Champion images downloaded.");
    }

    liveGameBackground = await Canvas.loadImage("./assets/loading_screen.png");
}

export async function HandleLoseStreak(interaction: ChatInputCommandInteraction) {
    const summonerName = interaction.options.getString("summoner")!;
    let summoner;
    
    try {
        summoner = await Service.GetSummoner(summonerName);
    } catch (err: any) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Summoner **${summonerName}** doesn't exist.`)] });
        return;
    }
    const loseStreak = await Service.GetLoseStreak(summoner);
    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`**${summonerName}** has lose streak of ${loseStreak} ${loseStreak == 1 ? "game": "games"}.`)] });
}

export async function HandleSummonerData(interaction: ChatInputCommandInteraction) {
    const summonerName = interaction.options.getString("summoner")!;

    let summoner;
    try {
        summoner = await Service.GetSummoner(summonerName);
    } catch (err) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Summoner **${summonerName}** doesn't exist.`)] });
        return;
    }
    const soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner);
    const lastGame = await Service.GetLastMatch(summoner);
    const summonerLastGameStats = Service.GetSummonerStatsFromMatch(lastGame, summoner);

    if (!summoner || !soloLeagueEntry || !lastGame || !summonerLastGameStats) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Summoner **${summonerName}** couldn't be loaded.`)] });
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
            text: `${gameType}${new Date(lastGame.info.gameEndTimestamp).toLocaleString("sk-SK", {
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
}

export async function HandleInGameData(interaction: ChatInputCommandInteraction) {
    const summonerName = interaction.options.getString("summoner")!;
    const canvas = Canvas.createCanvas(1920, 989);
    const context = canvas.getContext("2d");

    // Background
    context.drawImage(liveGameBackground, 0, 0, canvas.width, canvas.height);

    const summoner = await Service.GetSummoner(summonerName);
    let gameInfo;
    try {
        gameInfo = await Service.GetCurrentActiveMatch(summoner);
    } catch(err: any) {
        if (err.response && err.response.status == 404) {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`**${summonerName}** is not in-game.`)] });
        } else {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("Something went wrong.")] });
        }
        return;
    }

    if (!summoner || !gameInfo) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Summoner **${summonerName}** couldn't be loaded.`)] });
        return;
    }

    // Time elapsed
    const timeElapsed = (Date.now().valueOf() - gameInfo.gameStartTime) / 1000;
    const minutes = String(Math.floor(timeElapsed / 60));
    const seconds = String(Math.floor(timeElapsed % 60)).padStart(2, '0');

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "40px Georgia";
    context.fillStyle = "#FFFFFF";
    context.fillText(`${minutes}:${seconds}`, canvas.width / 2, canvas.height / 2);

    // Players
    let count = 0;
    for (let participant of gameInfo.participants) {
        const participantChamp = dragon.champions.find((champion) => champion.key === String(participant.championId))
        const summoner = await Service.GetSummonerById(participant.summonerId);
        let soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner);

        if (!soloLeagueEntry) {
            soloLeagueEntry = {} as LeagueEntryDTO;

            soloLeagueEntry.tier = "Unranked";
            soloLeagueEntry.rank = "";
        }

        const rect = participant.teamId == 100 ? playerRect : playerRect2;
        const index = count % 5;

        // context.strokeStyle = "#0099FF";
        // context.strokeRect(rect.x + index * rect.spacing, rect.y, rect.w, rect.h);

        // Champion image
        const champion = await Canvas.loadImage(`./assets/champions/${participantChamp!.id}.png`);
        context.drawImage(champion, rect.centerX - 120 / 2 + index * rect.spacing, rect.y + 60, 120, 120);
        
        // Summoner info
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#FFFFFF";
        context.font = "bold 25px Georgia";
        context.fillText(`${participantChamp?.name}`, rect.centerX + index * rect.spacing, rect.centerY);
        context.font = "20px Georgia";
        context.fillText(participant.summonerName, rect.centerX + index * rect.spacing, rect.centerY + 35);
        context.fillText(`${soloLeagueEntry.tier} ${soloLeagueEntry.rank}`, rect.centerX + index * rect.spacing, rect.centerY + 70);
        ++count;
    }
    
    // Bans
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "40px Georgia";
    context.fillStyle = "#FFFFFF";
    context.fillText("Bans", 118, canvas.height / 2 - 300);
    count = 0;
    for (let banned of gameInfo.bannedChampions) {
        const bannedChamp = dragon.champions.find((champion) => champion.key === String(banned.championId));
        const champion = await Canvas.loadImage(`./assets/champions/${bannedChamp!.id}.png`);
        context.drawImage(champion, 118 - 25, canvas.height / 2 + count * 60 - 270, 50, 50);
        ++count;
    }

    const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "ingame_data.png" });
    await interaction.editReply({ files: [attachment] });
}

export async function UpdateWatchList(client: Client) {
    const guilds = await BotData.find();
    
    guilds.forEach(async (guild) => {
        for (let summonerName of guild.watchlist!) {
            const summoner = await Service.GetSummoner(summonerName);
            const soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner);

            if (!summoner || !soloLeagueEntry) {
                return;
            }

            const stat = new Date().toLocaleString("sk-SK", {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h24',
                timeZone: 'Europe/Bratislava'
            }) + " - " + soloLeagueEntry.tier + " " + soloLeagueEntry.rank + " " + soloLeagueEntry.leaguePoints;

            await History.updateOne({ summoner: summonerName }, { $push: { history: stat } });
        }
    });
};

export async function HandleWatchList(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString("action");
    const summonerName = interaction.options.getString("summoner") || "Tonski";
    const data = await BotData.findOne({ guildId: interaction.guildId });
    const watchlist = data!.watchlist;

    if (action === "add") {
        if (watchlist.includes(summonerName)) {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`**${summonerName}** is already in watchlist.`)] });
            return;
        }

        try {
            const summoner = await Service.GetSummoner(summonerName);
        } catch (err) {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Summoner **${summonerName}** doesn't exist.`)] });
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
        
        await data!.updateOne({ $push: { "watchlist": summonerName } });
        await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`**${summonerName}** was added to watchlist.`)] });
    } else if (action === "remove") {
        if (!watchlist.includes(summonerName)) {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`**${summonerName}** is not in watchlist.`)] });
            return;
        }

        await data!.updateOne({ $pull: { "watchlist": summonerName } });
        await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`**${summonerName}** was removed from watchlist.`)] });
    } else {
        await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Current watchlist: **${watchlist}**`)] });
    }
}

export async function HandleHistory(interaction: ChatInputCommandInteraction) {
    const summonerName = interaction.options.getString("summoner")!;
    const data = await BotData.findOne({ guildId: interaction.guildId });
    const watchlist = data!.watchlist;

    if (!watchlist.includes(summonerName)) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`**${summonerName}** is not in watchlist.`)] });
        return;
    }
    
    // Can send up to 4096 characters in embed, 100 history lines

    const history = await History.findOne({ summoner: summonerName });

    if (history!.history.length === 0) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`${summonerName} has no logged history yet.`)] });
        return;
    }

    const historyFormatted = history!.history.slice(-100);
    historyFormatted.forEach((str, index) => {
        historyFormatted[index] = "* " + str;
    })

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(
        historyFormatted.join("\n"),
        `${summonerName} - History`
    )] });
}