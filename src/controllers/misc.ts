import { CommandInteraction, ChatInputCommandInteraction } from "discord.js";
import Insults from "~/data/insults";
import User from "~/models/user";
import * as Embed from "~/utils/embed";

export async function Poke(interaction: CommandInteraction) {
    await interaction.reply("startuj rift <@344971043720396810>");
}

export async function Insult(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user");
    await interaction.reply("<@" + user + "> " + Insults[Math.floor(Math.random() * Insults.length)]);
}

export async function Balance(interaction: CommandInteraction) {
    await interaction.deferReply();
    const user = await User.findOne({ id: interaction.user.id });
    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Your balance is **${user!.money}$**`)] });
}