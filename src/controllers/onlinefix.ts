import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Game } from "~/types/onlinefix/game.type";
import * as Service from "~/services/onlinefix";

let games: Game[] = [];

export async function Init() {
    console.log("Loading games...");
    try {
        games = await Service.LoadGames();
    } catch(err) {
        console.log("Failed to load games.");
    }
    console.log("Games loaded.");
}

export async function Handle(interaction: CommandInteraction) {
    const randGame: Game = games[Math.floor(Math.random() * games.length)];

    const messageEmbed = new EmbedBuilder()
        .setTitle("Random Game")
        .setColor(0x00fdfd)
        .setFields(
            { name: "Name", value: randGame.name },
            { name: "Link", value: randGame.link },
        )
        .setImage(randGame.imageUrl);

    await interaction.editReply({ embeds: [messageEmbed] });
}