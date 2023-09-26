import { ChatInputCommandInteraction } from "discord.js";
import * as Mines from "./mines";

export async function Handle(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const game = interaction.options.getString("game");

    switch (game) {
        case "game_mines":
            await Mines.Handle(interaction);
            break
    }
}