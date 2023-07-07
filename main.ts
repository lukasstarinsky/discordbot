import "dotenv/config";
import { Client, GatewayIntentBits, EmbedBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import * as API from "./riotapi/api";
import fs from "fs";

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

const loseIcon = "https://images-ext-1.discordapp.net/external/9XjtWykrwHupmNH8M1nT-9oELKgpHmsW-Ho3eWV86CY/%3Fsize%3D48/https/cdn.discordapp.com/emojis/1058849393370992650.gif";
const champIcon = "https://ddragon.leagueoflegends.com/cdn/10.23.1/img/champion/";

declare global {
    interface String {
        capitalize(): string;
    }
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

const checkTonski = async () => {
    const general = await client.channels.fetch("755055216759668808") as TextChannel;
    const tonski = general.members.get("344971043720396810");

    const summoner = await API.GetSummoner("Tonski");
    const soloLeagueEntry = await API.GetSoloLeagueEntry(summoner);

    const tonskiStat = new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h24',
        timeZone: 'Europe/Bratislava'
    }) + " - " + soloLeagueEntry.tier + " " + soloLeagueEntry.rank + " " + soloLeagueEntry.leaguePoints;

    fs.appendFile("tonski.txt", tonskiStat + "\n", (err) => {
        if (err) console.error(err);
    });

    if (soloLeagueEntry.tier === "GOLD") {
        const message = `<@908823905878290452> <@208217888560119809> <@390580146299600896> <@482094133255733259> \n!!! TONSKI HAS REACHED GOLD !!!`;
        tonski?.setNickname("winton goldski");
        general.send(loseIcon);
        return general.send({ "embeds": [
            {
              "title": `Tonski - Announcement`,
              "description": message,
              "color": 0x00FFFF
            }
        ] });
    }
};

client.on("ready", async () => {
    console.log(`Logging in...`);

    await checkTonski();
    setInterval(async () => {
        await checkTonski();
    }, 1000 * 60 * 30);

    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = interaction.commandName;

    if (command === "lol") {
        try {
            const summonerName = (interaction as ChatInputCommandInteraction).options.getString("summoner") || "Tonski";
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

            const messageEmbed = new EmbedBuilder()
                .setTitle(summoner.name)
                .setColor(summonerLastGameStats.win ? 0x00FF00 : 0xFF0000)
                .setFields(
                    { name: "Rank", value: `${soloLeagueEntry.tier.toLowerCase().capitalize()} ${soloLeagueEntry.rank} ${soloLeagueEntry.leaguePoints} LP`, inline: true },
                    { name: "W/L", value: `${soloLeagueEntry.wins}W/${soloLeagueEntry.losses}L`, inline: true },
                    { name: "WR", value: `${winrate.toFixed(2)}%`, inline: true },
                    { name: "Time Played", value: timePlayed },
                    { name: "Score", value: `${summonerLastGameStats.kills}/${summonerLastGameStats.deaths}/${summonerLastGameStats.assists}`, inline: true },
                    { name: "KDA", value: kda.toFixed(2), inline: true },
                    { name: "KP", value: `${kp.toFixed(2)}%`, inline: true },
                    { name: "Damage dealt", value: `${summonerLastGameStats.totalDamageDealtToChampions.toString()}, which is ${damagePercentage.toFixed(2)}% of team total` },
                    { name: "CS Advantage", value: hadCSAdvantage ? "Yes": "No", inline: true },
                    { name: "CS First 10 minutes", value: `${csFirstTenMinutes}`, inline: true }
                )
                .setThumbnail(champIcon + summonerLastGameStats.championName + ".png")
                .setImage(summonerLastGameStats.summonerName === "Tonski" && !summonerLastGameStats.win ? loseIcon : null)
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
            interaction.reply({ embeds: [messageEmbed ]});
        } catch (err: any) {
            if (err.response) {
                interaction.reply(err.response.status + " - Something went wrong.");
            } else {
                interaction.reply("Something went wrong.");
            }
            console.error(err);
        }
    } else if (command === "tonski") {
        fs.readFile("tonski.txt", "utf8", (err, data) => {
            if (err) return console.error(err);
            //interaction.reply(data.split("\n").slice(-25).join("\n"));
            interaction.reply({ "embeds": [
                {
                  "title": `Tonski - History`,
                  "description": data.split("\n").slice(-25).join("\n"),
                  "color": 0x00FFFF
                }
            ] })
        });
    }
});

client.login(process.env.TOKEN);
