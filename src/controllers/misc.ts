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
    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Your balance is **${user!.money?.toLocaleString("sk-SK")}$**`)] });
}

export async function Top10(interaction: CommandInteraction) {
    await interaction.deferReply();
    const users = await User.find({"money": {$ne : 50000}}).sort({"money":-1}).limit(10); // Selects (max) 10 users desc by balance (excluding users with 50k bal)
    
    let text: string = "";
    let i: number = 1;
    users.forEach(user => {
        text += `**${i}.** <@${user.id}>: **${user.money?.toLocaleString("sk-SK")} $**\n`;
        ++i;
    })

    await interaction.editReply({ embeds: [Embed.CreateEmbed("TOP 10 User Balance", 0x00FFFF, text)] });
}