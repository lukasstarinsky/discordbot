const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");
require('dotenv').config();

const commands = [
  {
    name: "lol",
    description: "Show data of selected summoner",
    options: [
      {
        name: "summoner",
        description: "Name of the summoner",
        type: ApplicationCommandOptionType.String,
        required: true
      }
    ]
  },
  {
    name: "random_game",
    description: "Show random game from online-fix.me"
  },
  {
    name: "tonski",
    description: "Get history of tonski rank"
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
  } catch (err) {
    console.log(err);
  }
})();