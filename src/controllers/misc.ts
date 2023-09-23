import { CommandInteraction, ChatInputCommandInteraction } from "discord.js";
import Insults from "~/data/insults";

export async function Poke(interaction: CommandInteraction) {
    await interaction.reply("startuj rift <@344971043720396810>");
}

export async function Insult(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user");
    await interaction.reply("<@" + user + "> " + Insults[Math.floor(Math.random() * Insults.length)]);
}