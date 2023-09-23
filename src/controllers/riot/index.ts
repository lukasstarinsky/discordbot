import { CommandInteraction } from "discord.js";

export async function Handle(interaction: CommandInteraction) {
    console.log(interaction.commandName);
}