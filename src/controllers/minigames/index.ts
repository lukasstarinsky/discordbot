import { ChatInputCommandInteraction } from "discord.js";
import * as Mines from "./mines";
import * as Embed from "~/utils/embed";

export async function Handle(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const game = interaction.options.getString("game");

        switch (game) {
            case "game_mines":
                await Mines.Handle(interaction);
                break;
        }
    } catch(err: any) {
        await interaction.editReply({ embeds: [Embed.CreateErrorEmbed("Something went wrong.")] });
        console.error(err);
    }
}