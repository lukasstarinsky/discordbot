const cheerio = require("cheerio");
const axios = require("axios");
const fs = require('fs');

require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

let games = []

const winIcon = "https://cdn.discordapp.com/emojis/586232050051448853.webp?size=44&quality=lossless";
const loseIcon = "https://images-ext-1.discordapp.net/external/9XjtWykrwHupmNH8M1nT-9oELKgpHmsW-Ho3eWV86CY/%3Fsize%3D48/https/cdn.discordapp.com/emojis/1058849393370992650.gif";
const champIcon = "https://ddragon.leagueoflegends.com/cdn/10.23.1/img/champion/";

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

const loadGames = async () => {
  const genresList = [
    {"arcade": 5},
    {"survival": 3},
    {"fighting": 3},
    {"sandbox" : 2},
    {"rpg": 4},
    {"horror": 3},
    {"shooter": 7}
  ];

  for (i of genresList) {
    let [genre, pages] = Object.entries(i)[0];
    for (let page = 1; page <= pages; page++) {
      const url = `https://online-fix.me/${genre}/page/${page}/`;

      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      $(".news").each((index, el) => {
        const image = $(el).find(".img img").attr("data-src");
        const name = $(el).find(".article-content a h2").text().replaceAll("�", "").trim();
        const link = $(el).find(".big-link").attr("href");

        const game = {
          name,
          link,
          image
        };

        games.push(game);
      });
      await sleep(100 * page);
    }
  }
}

const checkTonski = async () => {
  const general = await client.channels.fetch("755055216759668808");
  const tonski = await general.members.get("344971043720396810");

  const summonerUrl = "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Tonski";
  const summoner = await axios.get(summonerUrl, { headers: {
    "X-Riot-Token": process.env.RIOT_API
  }});

  const summonerRankedUrl = `https://eun1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.data.id}`
  const summonerRankedData = await axios.get(summonerRankedUrl, { headers: {
    "X-Riot-Token": process.env.RIOT_API
  }});

  for (rankedType of summonerRankedData.data) {
    if (rankedType.queueType == "RANKED_SOLO_5x5") {
      const date = new Date();
      const tonskiStat = date.toLocaleString() + " - " + rankedType.tier + " " + rankedType.rank + " " + rankedType.leaguePoints;
      fs.appendFile('tonski.txt', tonskiStat + "\n", function (err) {
        if (err) console.log(err);
      });
      console.log(tonskiStat);

      if (rankedType.tier == "GOLD") {
        const message = `<@908823905878290452> <@208217888560119809> <@390580146299600896> <@482094133255733259> \n!!! TONSKI HAS REACHED GOLD !!!`;
        tonski.setNickname("winton goldski");
        general.send(loseIcon);
        return general.send({ content: message });
      }
    }
  }
}

client.on("ready", async () => {
  console.log(`Logging in...`);
  await loadGames();
  console.log(`Logged in as ${client.user.tag}!`);

  await checkTonski();
  setInterval(async () => {
    await checkTonski();
  }, 1000 * 60 * 30);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = interaction.commandName;

  if (command === "random_game") {
    const randGame = games[Math.floor(Math.random() * games.length)];

    const messageEmbed = new EmbedBuilder()
          .setTitle("Random Game")
          .setColor(0x00fdfd)
          .setFields(
            { name: "Name", value: randGame.name },
            { name: "Link", value: randGame.link },
          )
          .setImage(randGame.image);

    interaction.reply({ embeds: [messageEmbed] });
  } else if (command === "lol") {
    const summonerName = interaction.options.getString("summoner");
    const summonerUrl = `https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`;
    const summoner = await axios.get(summonerUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    const summonerRankedUrl = `https://eun1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.data.id}`
    const summonerRankedData = await axios.get(summonerRankedUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    const matchHistoryIdsUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.data.puuid}/ids?start=0&count=1`
    const matchHistoryIds = await axios.get(matchHistoryIdsUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});
    const lastMatchId = matchHistoryIds.data[0];

    const lastMatchUrl = `https://europe.api.riotgames.com/lol/match/v5/matches/${lastMatchId}`
    const lastMatchData = await axios.get(lastMatchUrl, { headers: {
      "X-Riot-Token": process.env.RIOT_API
    }});

    for (participant of lastMatchData.data.info.participants) {
      if (participant.summonerName == summonerName) {
        for (rankedType of summonerRankedData.data) {
          if (rankedType.queueType == "RANKED_SOLO_5x5") {
            const kda = participant.challenges.kda;
            const winrate = (rankedType.wins / (rankedType.wins + rankedType.losses)) * 100;
            const damagePercentage = participant.challenges.teamDamagePercentage * 100;
            const kp = participant.challenges.killParticipation * 100;
            const hadCSAdvantage = participant.challenges.maxCsAdvantageOnLaneOpponent > 0;
            const csFirstTenMinutes = participant.challenges.laneMinionsFirst10Minutes;
            const gameType = lastMatchData.data.info.queueId == 420 ? "SoloQ - " : lastMatchData.data.info.queueId == 440 ? "FlexQ - " : "";

            let seconds = participant.timePlayed % 60;
            seconds = seconds < 10 ? String(seconds).padStart(2, "0") : seconds;
            const timePlayed = `${Math.floor(participant.timePlayed / 60)}:${seconds}`;
            
            const messageEmbed = new EmbedBuilder()
              .setTitle(rankedType.summonerName)
              .setColor(participant.win ? 0x00FF00 : 0xFF0000)
              .setFields(
                { name: "Rank", value: `${rankedType.tier.toLowerCase().capitalize()} ${rankedType.rank} ${rankedType.leaguePoints} LP`, inline: true },
                { name: "W/L", value: `${rankedType.wins}W/${rankedType.losses}L`, inline: true },
                { name: "WR", value: `${winrate.toFixed(2)}%`, inline: true },
                { name: "Time Played", value: timePlayed },
                { name: "Score", value: `${participant.kills}/${participant.deaths}/${participant.assists}`, inline: true },
                { name: "KDA", value: kda.toFixed(2), inline: true },
                { name: "KP", value: `${kp.toFixed(2)}%`, inline: true },
                { name: "Damage dealt", value: `${participant.totalDamageDealtToChampions.toString()}, which is ${damagePercentage.toFixed(2)}% of team total` },
                { name: "CS Advantage", value: hadCSAdvantage ? "Yes": "No", inline: true },
                { name: "CS First 10 minutes", value: `${csFirstTenMinutes}`, inline: true }
              )
              .setThumbnail(champIcon + participant.championName + ".png")
              .setImage(participant.summonerName === "Tonski" && !participant.win ? loseIcon : null)
              .setFooter({
                text: `${gameType}${new Date(lastMatchData.data.info.gameEndTimestamp).toLocaleString('en-US', {
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
        }
      }
    }
  } else if (command === "tonski") {
    fs.readFile("tonski.txt", "utf8", (err, data) => {
      if (err) return console.error(err);
      interaction.reply(data.split("\n").slice(-10).join("\n"));
    });
  }
});

client.login(process.env.TOKEN);