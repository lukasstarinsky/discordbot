import { ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from "discord.js";
import fs from "fs";
import axios from "axios";
import Canvas from "@napi-rs/canvas";
import { LeagueEntryDTO } from "~/types/riot";
import { Champions } from "~/types/riot/ddragon";
import * as Service from "~/services/riot";
import * as Embed from "~/utils/embed";
import { Urls } from "~/data/constants";
import "~/utils/string";

let champions: Champions;

export async function Initialize() {
    console.log("Fetching lol champion images...");

    if (!fs.existsSync("./assets/champions")) {
        fs.mkdirSync("./assets/champions");
    }

    const response = await axios.get<Champions>(Urls.DDRAGON_CHAMPIONS);
    champions = response.data;
    Object.entries(champions.data).forEach(async ([key, value]) => {
        const iconResponse = await axios.get(Urls.DDRAGON_CHAMPION_ICON + value.image.full, { responseType: "stream" });
        iconResponse.data.pipe(fs.createWriteStream(`./assets/champions/${value.image.full}`));
    });
}

export async function HandleLoseStreak(interaction: ChatInputCommandInteraction) {
    const accountNameTag = interaction.options.getString("account")!.split("#");
    const region = interaction.options.getString("region") || "eun1";
    const name = accountNameTag[0];
    const tag = accountNameTag[1];
    
    let account;
    try {
        account = await Service.GetAccount(name, tag);
    } catch (err: any) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Account **${name}#${tag}** doesn't exist.`)] });
        return;
    }
    const loseStreak = await Service.GetLoseStreak(account);

    const embed = new EmbedBuilder()
        .setTitle(`**${name}** Lose Streak`)
        .setThumbnail(loseStreak > 0 ? Urls.CLASSIC_DUCK : null)
        .setFields({ name: "Lose Streak", value: `${loseStreak} ${loseStreak > 1 ? "games": "game"}`, inline: true });

    await interaction.editReply({ embeds: [embed] });
}

export async function HandleSummonerData(interaction: ChatInputCommandInteraction) {
    const accountNameTag = interaction.options.getString("account")!.split("#");
    const region = interaction.options.getString("region") || "eun1";
    const name = accountNameTag[0];
    const tag = accountNameTag[1];

    let account;
    try {
        account = await Service.GetAccount(name, tag);
    } catch (err) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`Account **${name}#** doesn't exist.`)] });
        return;
    }
    const soloLeagueEntry = await Service.GetSoloLeagueEntry(account, region);
    const lastGame = await Service.GetLastMatch(account);
    const summonerLastGameStats = Service.GetSummonerStatsFromMatch(lastGame, account);

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
        .setTitle(name)
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
        .setThumbnail(Urls.DDRAGON_CHAMPION_ICON + summonerLastGameStats.championName + ".png")
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
    await interaction.editReply({ embeds: [messageEmbed] });
}

export async function HandleInGameData(interaction: ChatInputCommandInteraction) {
    const playerRect = {
        x: 240,
        y: 6,
        w: 249,
        h: 456,
        spacing: 296,
        centerX: 364,
        centerY: 234
    };
    const playerRect2 = {
        ...playerRect,
        y: 529,
        centerY: 757
    };
    const canvas = Canvas.createCanvas(1920, 989);
    const context = canvas.getContext("2d");

    // Background
    const canvasBackground = await Canvas.loadImage("./assets/loading_screen.png");
    context.drawImage(canvasBackground, 0, 0, canvas.width, canvas.height);

    const accountNameTag = interaction.options.getString("account")!.split("#");
    const region = interaction.options.getString("region") || "eun1";
    const name = accountNameTag[0];
    const tag = accountNameTag[1];

    let gameInfo;
    let account;
    try {
        account = await Service.GetAccount(name, tag);
        gameInfo = await Service.GetCurrentActiveMatch(account, region);
    } catch(err: any) {
        if (err.response && err.response.status == 404) {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed(`**${name}#${tag}** is not in-game.`)] });
        } else {
            await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("Something went wrong.")] });
        }
        return;
    }

    // Time elapsed
    const timeElapsed = (Date.now().valueOf() - gameInfo.gameStartTime) / 1000;
    const minutes = String(Math.floor(timeElapsed / 60));
    const seconds = String(Math.floor(timeElapsed % 60)).padStart(2, '0');

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 40px Rubik";
    context.fillStyle = "#FFFFFF";
    context.fillText(`${minutes}:${seconds}`, canvas.width / 2, canvas.height / 2);

    // Players
    let count = 0;
    for (let participant of gameInfo.participants) {
        const champion = Object.entries(champions.data).find(([key, value]) => value.key === String(participant.championId) );
        const summoner = await Service.GetAccountByPUUID(participant.puuid);
        let soloLeagueEntry = await Service.GetSoloLeagueEntry(summoner, region);

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
        const championIcon = await Canvas.loadImage(`./assets/champions/${champion![1].image.full}`);
        context.drawImage(championIcon, rect.centerX - 120 / 2 + index * rect.spacing, rect.y + 60, 120, 120);
        
        // Summoner info
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#FFFFFF";
        context.font = "bold 30px Rubik";
        context.fillText(`${champion![0]}`, rect.centerX + index * rect.spacing, rect.centerY);
        context.font = "25px Rubik";
        context.fillText(summoner.gameName, rect.centerX + index * rect.spacing, rect.centerY + 40);

        // Rank info
        const rankIcon = await Canvas.loadImage(`./assets/ranks/${soloLeagueEntry.tier.toLowerCase()}.png`);
        context.drawImage(rankIcon, rect.centerX - 50 + index * rect.spacing, rect.centerY + 50, 100, 100);

        context.fillText(`${soloLeagueEntry.tier} ${soloLeagueEntry.rank}`, rect.centerX + index * rect.spacing, rect.centerY + 160);
        context.font = "20px Rubik";
        context.fillText(`${soloLeagueEntry.leaguePoints} LP`, rect.centerX + index * rect.spacing, rect.centerY + 185);
        
        ++count;
    }
    
    // Bans
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "40px Rubik";
    context.fillStyle = "#FFFFFF";
    context.fillText("Bans", 118, canvas.height / 2 - 300);
    count = 0;
    for (let banned of gameInfo.bannedChampions) {
        if (banned.championId === -1)
            continue;
        const champion = Object.entries(champions.data).find(([key, value]) => value.key === String(banned.championId));
        const championIcon = await Canvas.loadImage(`./assets/champions/${champion![1].image.full}`);
        context.drawImage(championIcon, 118 - 25, canvas.height / 2 + count * 60 - 270, 50, 50);
        ++count;
    }

    const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "ingame_data.png" });
    await interaction.editReply({ files: [attachment] });
}