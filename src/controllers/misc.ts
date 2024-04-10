import { CommandInteraction, ChatInputCommandInteraction } from "discord.js";
import Insults from "~/data/insults";
import User from "~/models/user";
import Restriction from "~/models/restriction";
import * as Embed from "~/utils/embed";

export async function Poke(interaction: CommandInteraction) {
    await interaction.editReply("startuj rift <@344971043720396810>");
}

export async function Insult(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user");
    await interaction.editReply("<@" + user + "> " + Insults[Math.floor(Math.random() * Insults.length)]);
}

export async function ShowRestriction(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getUser("user")!;
    const restriction = await Restriction.findOne({ user: userId });
    const currentDate = new Date();

    if (!restriction || currentDate > restriction!.until)
        return await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`User ${userId} doesn't have any restriction`)] });
    
    const difference: number = restriction.until.getTime() - currentDate.getTime();

    const days: number = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours: number = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes: number = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Game restriction for ${userId} is set until ${restriction!.until.toLocaleString("sk-SK")}\n
        Remaining: ${days} Days, ${hours} Hours and ${minutes} Minutes`)] });
}

export async function SetRestriction(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getUser("user");

    var date = new Date();
    date.setDate(date.getDate() + interaction.options.getNumber("until")!);

    await Restriction.findOneAndUpdate({ user: userId }, { until: date }, { upsert: true, new: true, setDefaultsOnInsert: true });

    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Game restriction for ${userId} set until ${date.toLocaleString("sk-SK")}`)] });
}

export async function Balance(interaction: CommandInteraction) {
    const user = await User.findOne({ id: interaction.user.id });
    await interaction.editReply({ embeds: [Embed.CreateInfoEmbed(`Your balance is **${user!.money?.toLocaleString("sk-SK")}$**`)] });
}

export async function Top10(interaction: CommandInteraction) {
    const users = await User.find({"money": {$ne : 50000}}).sort({"money":-1}).limit(10); // Selects (max) 10 users desc by balance (excluding users with 50k bal)
    
    let text: string = "";
    let i: number = 1;
    users.forEach(user => {
        text += `**${i}.** <@${user.id}>: **${user.money?.toLocaleString("sk-SK")} $**\n`;
        ++i;
    })

    await interaction.editReply({ embeds: [Embed.CreateEmbed("TOP 10 User Balance", 0x00FFFF, text)] });
}